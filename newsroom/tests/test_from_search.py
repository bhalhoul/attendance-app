"""Tests for search-based intake (Parallel Search responses). Offline: uses a fixture response."""
import json
from datetime import datetime, timezone
from pathlib import Path

import yaml
from jsonschema import Draft202012Validator, FormatChecker

from intake.from_search import guess_language, ingest_search, is_article_url, run

ROOT = Path(__file__).resolve().parents[1]
FIX = ROOT / "tests" / "fixtures"
DESKS = ROOT / "config" / "desks.yaml"
NOW = datetime(2026, 11, 23, 12, 0, 0, tzinfo=timezone.utc)
RAW_SCHEMA = Draft202012Validator(json.loads((ROOT / "schemas" / "raw_item.schema.json").read_text()), format_checker=FormatChecker())
PAYLOAD = json.loads((FIX / "search_sample.json").read_text(encoding="utf-8"))
MOROCCO = yaml.safe_load(DESKS.read_text(encoding="utf-8"))["desks"]["morocco"]


def by_url(items):
    return {i["url"]: i for i in items}


def test_desks_config_has_all_five_desks_with_short_queries():
    desks = yaml.safe_load(DESKS.read_text(encoding="utf-8"))["desks"]
    assert set(desks) == {"morocco", "spain_ceuta", "world", "sports", "economy"}
    for name, d in desks.items():
        assert d["objective"] and 1 <= len(d["queries"]) <= 3, name
        assert all(2 <= len(q.split()) <= 6 for q in d["queries"]), name


def test_items_match_schema_and_are_marked_as_search():
    res = ingest_search(PAYLOAD, "morocco", MOROCCO, NOW)
    assert res.items
    for item in res.items:
        assert not [e.message for e in RAW_SCHEMA.iter_errors(item)]
        assert item["origin"] == "search" and item["feed_url"] == "parallel-search:search_fixture0001"


def test_day_only_dates_are_not_given_an_invented_time():
    items = by_url(ingest_search(PAYLOAD, "morocco", MOROCCO, NOW).items)
    first = items["https://www.ma-news.test/politique/2026/11/23/sample-article-1?utm_source=search"]
    assert first["published_at"] is None and first["published_at_raw"] == "2026-11-23"
    assert "date_only" in first["flags"] and "stale" not in first["flags"]


def test_old_and_undated_results_are_flagged():
    items = by_url(ingest_search(PAYLOAD, "morocco", MOROCCO, NOW).items)
    assert "stale" in items["https://fr-news.test/article/2026-11-20-ancien"]["flags"]
    assert "no_date" in items["https://en-news.test/story/77"]["flags"]


def test_home_and_section_pages_are_skipped_and_logged():
    res = ingest_search(PAYLOAD, "morocco", MOROCCO, NOW)
    urls = {i["url"] for i in res.items}
    assert "https://ma-news.test/" not in urls and "https://ma-news.test/economie" not in urls
    assert sum("not an article page" in w for w in res.warnings) == 2
    assert any("missing title" in w for w in res.warnings)
    assert is_article_url("https://x.test/2026/11/23/a") and not is_article_url("https://x.test/sport")
    assert is_article_url("https://x.test/news/ice-arrest-alaska-airlines-flight-seattle/")
    assert not is_article_url("https://x.test/country/some-long-country-name-page/MGPWLP/84")
    assert not is_article_url("https://x.test/deportes/resultados/futbol/primera/jornada")
    assert not is_article_url("https://x.test/football/spain/laliga/")


def test_source_is_the_domain_and_html_is_stripped():
    first = ingest_search(PAYLOAD, "morocco", MOROCCO, NOW).items[0]
    assert first["source_id"] == "ma-news.test"
    assert "<p>" not in first["summary"] and "نص تجريبي" in first["summary"]


def test_language_guess():
    assert guess_language("الحكومة تعلن") == "ar"
    assert guess_language("El puerto de la ciudad amplía el horario") == "es"
    assert guess_language("Le marché et les prix au port") == "fr"
    assert guess_language("Undated story about markets") == "en"


def test_missing_or_bad_response_produces_error_and_no_items(tmp_path):
    assert ingest_search({}, "morocco", MOROCCO, NOW).errors
    assert ingest_search({"results": []}, "morocco", MOROCCO, NOW).warnings
    bad = tmp_path / "bad.json"
    bad.write_text("{not json", encoding="utf-8")
    summary = run("morocco", bad, tmp_path / "data", DESKS, now=NOW)
    assert summary["errors"] == 1 and summary["items"] == 0


def test_run_end_to_end_dedupes_and_links_copies(tmp_path):
    summary = run("morocco", FIX / "search_sample.json", tmp_path, DESKS, now=NOW)
    items = json.loads(Path(summary["items_file"]).read_text(encoding="utf-8"))
    assert summary["items"] == len(items) == 5 and summary["duplicates"] == 1 and summary["errors"] == 0
    a = next(i for i in items if i["source_id"] == "ma-news.test")
    b = next(i for i in items if i["source_id"] == "other-outlet.test")
    assert a["same_title_as"] == [b["id"]]       # linked as a copy, not counted as independent


def test_unknown_desk_is_an_error(tmp_path):
    summary = run("weather", FIX / "search_sample.json", tmp_path, DESKS, now=NOW)
    assert summary["errors"] == 1 and summary["items_file"] is None
