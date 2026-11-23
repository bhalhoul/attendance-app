"""Tests for the intake stage. All feeds are local fixtures: no network is used."""
import json
from datetime import datetime, timezone
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator, FormatChecker

from intake.dedupe import dedupe
from intake.normalize import canonical_url, normalize_title, title_similarity
from intake.parse_feed import parse_feed
from intake.run_intake import load_sources, run

ROOT = Path(__file__).resolve().parents[1]
FIX = ROOT / "tests" / "fixtures"
NOW = datetime(2026, 11, 23, 12, 0, 0, tzinfo=timezone.utc)
RAW_SCHEMA = Draft202012Validator(json.loads((ROOT / "schemas" / "raw_item.schema.json").read_text()), format_checker=FormatChecker())
STORY_SCHEMA = Draft202012Validator(json.loads((ROOT / "schemas" / "story.schema.json").read_text()), format_checker=FormatChecker())


@pytest.fixture(scope="module")
def sources():
    return {s.id: s for s in load_sources(FIX / "sources.fixtures.yaml")}


def parse(sources, sid):
    s = sources[sid]
    return parse_feed((FIX / s.feed_url).read_bytes(), s, NOW)


# ---------- normalisation ----------

def test_canonical_url_strips_tracking_fragment_www_and_slash():
    assert canonical_url("http://WWW.Ma-Sample.test/news/101/?utm_source=rss&utm_medium=feed") == "https://ma-sample.test/news/101"
    assert canonical_url("https://ceuta-a.test/politica/2002.html?fbclid=abc123") == "https://ceuta-a.test/politica/2002.html"
    assert canonical_url("https://ceuta-a.test/local/2001.html#comentarios") == "https://ceuta-a.test/local/2001.html"
    assert canonical_url("https://x.test/a?b=2&a=1&utm_campaign=z") == "https://x.test/a?a=1&b=2"


def test_title_normalisation_ignores_arabic_diacritics_and_spanish_accents():
    assert normalize_title("افتتاحُ خطِّ حافلاتٍ") == normalize_title("افتتاح خط حافلات")
    assert normalize_title("Reunión ÁRBITRO") == "reunion arbitro"
    assert title_similarity("إعلان القرار", "اعلان القرار") == 1.0


# ---------- parsing ----------

def test_every_parsed_item_matches_raw_schema(sources):
    for sid in ("ma_sample", "ceuta_a", "ceuta_b", "sports_s"):
        for item in parse(sources, sid).items:
            errors = list(RAW_SCHEMA.iter_errors(item))
            assert not errors, f"{sid}: {[e.message for e in errors]}"


def test_dates_are_converted_to_utc(sources):
    items = {i["url"]: i for i in parse(sources, "ma_sample").items}
    first = items["https://www.ma-sample.test/news/101/?utm_source=rss&utm_medium=feed"]
    assert first["published_at"] == "2026-11-23T09:30:00Z"           # 10:30 +0100
    assert first["published_at_raw"] == "Mon, 23 Nov 2026 10:30:00 +0100"
    atom = parse(sources, "sports_s").items[0]
    assert atom["published_at"] == "2026-11-23T10:45:00Z"            # Atom <updated>, already UTC


def test_missing_date_is_null_and_flagged_never_guessed(sources):
    item = next(i for i in parse(sources, "ma_sample").items if i["url"].endswith("/news/102"))
    assert item["published_at"] is None
    assert "no_date" in item["flags"]


def test_stale_and_future_dates_are_flagged(sources):
    items = {i["url"].rsplit("/", 1)[-1]: i for i in parse(sources, "ma_sample").items}
    assert "stale" in items["50"]["flags"]
    assert "future_date" in items["103"]["flags"]


def test_html_is_stripped_from_summary(sources):
    first = parse(sources, "ma_sample").items[0]
    assert "<" not in first["summary"] and "&amp;" not in first["summary"]
    assert "للاختبار" in first["summary"] and "&" in first["summary"]


def test_entry_without_link_is_skipped_with_warning(sources):
    res = parse(sources, "ma_sample")
    assert not any("بلا رابط" in i["title"] for i in res.items)
    assert any("missing link" in w for w in res.warnings)


def test_broken_feed_gives_error_and_no_items(sources):
    res = parse(sources, "broken_s")
    assert res.items == [] and res.errors


def test_empty_feed_gives_warning_and_no_items(sources):
    res = parse(sources, "empty_s")
    assert res.items == [] and any("no entries" in w for w in res.warnings)


# ---------- de-duplication ----------

def test_same_url_with_tracking_params_is_one_item(sources):
    kept, dups = dedupe(parse(sources, "ma_sample").items)
    urls = [k["canonical_url"] for k in kept]
    assert urls.count("https://ma-sample.test/news/101") == 1
    dup = next(d for d in dups if d["url"] == "https://ma-sample.test/news/101")
    assert dup["duplicate_of"] == kept[0]["id"]


def test_same_source_republished_with_new_link_is_duplicate(sources):
    kept, dups = dedupe(parse(sources, "ma_sample").items)
    assert any(d["url"].endswith("101-republished") for d in dups)
    assert not any(k["url"].endswith("101-republished") for k in kept)


def test_cross_source_same_title_is_kept_but_linked_not_counted_as_independent(sources):
    items = parse(sources, "ceuta_a").items + parse(sources, "ceuta_b").items
    kept, dups = dedupe(items)
    assert dups == []
    a = next(k for k in kept if k["source_id"] == "ceuta_a" and "bilateral" in k["title"])
    b = next(k for k in kept if k["source_id"] == "ceuta_b")
    assert a["same_title_as"] == [b["id"]] and b["same_title_as"] == [a["id"]]


def test_different_stories_are_not_merged(sources):
    kept, _ = dedupe(parse(sources, "ceuta_a").items)
    assert len(kept) == 2


# ---------- end-to-end run ----------

def test_run_writes_items_and_logs_every_failure(tmp_path):
    summary = run(FIX / "sources.fixtures.yaml", tmp_path, now=NOW)
    items = json.loads(Path(summary["items_file"]).read_text(encoding="utf-8"))
    log = [json.loads(l) for l in Path(summary["log_file"]).read_text(encoding="utf-8").splitlines()]

    assert summary["sources"] == 7                       # the disabled source is not run
    assert summary["items"] == len(items) == 8           # morocco: 6 parsed - 2 duplicates = 4; + 2 ceuta A + 1 ceuta B + 1 sports
    assert summary["duplicates"] == 2
    for item in items:
        assert not list(RAW_SCHEMA.iter_errors(item))
    errors = {(r["source"], r["message"].split(":")[0]) for r in log if r["level"] == "error"}
    assert ("broken_s", "broken_s") in errors
    assert ("missing_s", "fetch failed") in errors
    assert any(r["source"] == "empty_s" and r["level"] == "warning" for r in log)
    assert not any(i["source_id"] in ("broken_s", "empty_s", "missing_s", "disabled_s") for i in items)


def test_run_with_no_working_source_writes_no_items(tmp_path):
    cfg = tmp_path / "only_broken.yaml"
    cfg.write_text(f"sources:\n  - {{id: b, name: B, feed_url: {FIX / 'broken.xml'}, language: ar, desk: world, country: []}}\n", encoding="utf-8")
    summary = run(cfg, tmp_path / "data", now=NOW)
    assert summary["items"] == 0 and summary["errors"] >= 1
    assert json.loads(Path(summary["items_file"]).read_text()) == []


# ---------- story schema ----------

def test_story_schema_accepts_a_minimal_under_review_story():
    story = {
        "id": "st_20261123_0a1b2c3d", "title": "[عينة] عنوان", "neutral_summary": "", "desk": "spain_ceuta",
        "countries": ["ES"], "topics": [], "status": "verifying", "breaking": True,
        "original_source": {"name": "Muestra Ceuta A", "url": "https://ceuta-a.test/politica/2002.html", "published_at": "2026-11-23T08:15:00Z",
                            "owner": "Sample Group A", "independent": None, "cites": "Agency X"},
        "supporting_sources": [{"name": "Muestra Ceuta B", "url": "https://ceuta-b.test/n/77", "published_at": "2026-11-23T08:40:00Z",
                                "owner": "Sample Group B", "independent": False, "cites": "Agency X"}],
        "event_time": None,
        "verification": {"level": "under_review", "checked_at": None, "independent_source_count": 0, "evidence": [],
                         "unconfirmed": ["موعد الاجتماع"], "statements_vs_facts": [], "recycled_check": None, "checked_by": None},
        "importance": {"score": 40, "reasons": ["محلي"]},
        "raw_item_ids": ["raw_0123456789abcdef"],
        "history": [{"at": "2026-11-23T12:00:00Z", "status": "intake", "by": "intake"}],
        "created_at": "2026-11-23T12:00:00Z", "updated_at": "2026-11-23T12:00:00Z",
    }
    assert not [e.message for e in STORY_SCHEMA.iter_errors(story)]
    story["verification"]["level"] = "probably_true"
    assert list(STORY_SCHEMA.iter_errors(story)), "unknown verification levels must be rejected"
