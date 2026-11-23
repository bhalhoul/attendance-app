"""Convert a Parallel Search `web_search` response into RawItem records.

The search itself runs through the connected Parallel Search tool (called by Claude or by the
office page), not from this script. Save the tool's JSON response to a file, then:

    python -m intake.from_search --desk morocco --input ../data/inbox/morocco.json --data ../data

Rules:
* Only article pages are kept. Home pages and section indexes (path "/" or one short segment with
  no digits) are skipped and logged: they are not news items.
* `publish_date` from the tool is a day without a time. It is kept in `published_at_raw`,
  `published_at` stays null and the item gets the `date_only` flag. No time is invented.
* The source is the publisher's domain. Different domains of one owner are NOT merged here;
  independence is judged at the verification stage.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlsplit

import yaml

from .dedupe import dedupe
from .normalize import canonical_url, item_id, strip_html
from .parse_feed import ParseResult, _iso
from .run_intake import Log

SUMMARY_CHARS = 600
_AR = re.compile(r"[؀-ۿ]")
_ES_WORDS = {"el", "la", "los", "las", "de", "del", "en", "y", "que", "por", "con", "una", "para"}
_FR_WORDS = {"le", "la", "les", "des", "du", "et", "en", "un", "une", "pour", "avec", "au", "aux"}


def guess_language(text: str) -> str:
    if _AR.search(text):
        return "ar"
    words = set(re.findall(r"[a-záéíóúñçàèêëîïôûü']+", text.lower()))
    es, fr = len(words & _ES_WORDS), len(words & _FR_WORDS)
    if es == fr == 0:
        return "en"
    return "es" if es >= fr else "fr"


# Path segments that mark index, tag, results or topic pages rather than single articles.
LISTING_SEGMENTS = {"tag", "tags", "category", "categoria", "categorie", "section", "seccion", "interest", "topic",
                    "topics", "country", "data", "resultados", "results", "clubes", "clasificacion", "standings"}


def is_article_url(url: str) -> bool:
    """Heuristic: an article path is not a listing page and ends in a slug or an id."""
    path = urlsplit(url).path.strip("/")
    if not path:
        return False
    segments = [s.lower() for s in path.split("/")]
    if any(s in LISTING_SEGMENTS for s in segments):
        return False
    last = segments[-1].rsplit(".", 1)[0]
    dated = re.search(r"/(19|20)\d{2}/\d{1,2}/", "/" + path + "/")
    return bool(dated or re.search(r"\d", last)) or len(last) >= 25 or last.count("-") >= 3 or "%" in last


def source_of(url: str) -> str:
    host = (urlsplit(url).hostname or "").lower()
    return host[4:] if host.startswith("www.") else host


def ingest_search(payload: dict, desk: str, desk_cfg: dict, fetched_at: datetime) -> ParseResult:
    res = ParseResult()
    results = (payload or {}).get("results")
    if not isinstance(results, list):
        res.errors.append(f"{desk}: search response has no 'results' list")
        return res
    if not results:
        res.warnings.append(f"{desk}: search returned no results")
        return res
    search_id = payload.get("search_id") or "unknown"
    query = " | ".join(desk_cfg.get("queries", [])) or None
    max_age = timedelta(hours=desk_cfg.get("max_age_hours", 48))

    for n, r in enumerate(results):
        url, title = (r.get("url") or "").strip(), strip_html(r.get("title"))
        if not url or not title:
            res.warnings.append(f"{desk}: result #{n} skipped (missing {'url' if not url else 'title'})")
            continue
        if not is_article_url(url):
            res.warnings.append(f"{desk}: result #{n} skipped (not an article page: {url})")
            continue
        excerpts = r.get("excerpts") or []
        summary = strip_html(" … ".join(e for e in excerpts if isinstance(e, str)))[:SUMMARY_CHARS]
        raw_date = r.get("publish_date")
        flags: list[str] = []
        published_at = None
        if not raw_date:
            flags.append("no_date")
        else:
            try:
                d = date.fromisoformat(str(raw_date)[:10])
                flags.append("date_only")
                day_start = datetime(d.year, d.month, d.day, tzinfo=timezone.utc)
                if day_start - fetched_at > timedelta(hours=24):
                    flags.append("future_date")
                elif fetched_at - (day_start + timedelta(days=1)) > max_age:
                    flags.append("stale")
            except ValueError:
                flags.append("no_date")
        if not summary:
            flags.append("no_summary")
        canon = canonical_url(url)
        src = source_of(url)
        res.items.append({
            "id": item_id(canon), "source_id": src, "source_name": src,
            "feed_url": f"parallel-search:{search_id}", "url": url, "canonical_url": canon,
            "title": title, "summary": summary, "language": guess_language(title + " " + summary[:200]),
            "desk": desk, "country": list(desk_cfg.get("country", [])),
            "published_at": published_at, "published_at_raw": raw_date, "fetched_at": _iso(fetched_at),
            "flags": flags, "duplicate_of": None, "same_title_as": [], "origin": "search", "query": query,
        })
    return res


def run(desk: str, input_path: Path, data_dir: Path, desks_path: Path, now: datetime | None = None) -> dict:
    now = now or datetime.now(timezone.utc)
    day, stamp = now.strftime("%Y-%m-%d"), now.strftime("%H%M%S")
    log = Log(data_dir / "logs" / f"intake-{day}.jsonl")
    desks = (yaml.safe_load(desks_path.read_text(encoding="utf-8")) or {}).get("desks", {})
    if desk not in desks:
        log("error", desk, f"unknown desk '{desk}' (not in {desks_path.name})")
        return {"desk": desk, "items": 0, "duplicates": 0, "errors": 1, "warnings": 0, "items_file": None, "log_file": str(log.path)}
    try:
        payload = json.loads(input_path.read_text(encoding="utf-8"))
    except Exception as e:
        log("error", desk, f"cannot read search response: {type(e).__name__}: {e}")
        payload = None
    res = ingest_search(payload, desk, desks[desk], now) if payload is not None else ParseResult()
    for w in res.warnings:
        log("warning", desk, w)
    for e in res.errors:
        log("error", desk, e)
    kept, dups = dedupe(res.items)
    out_dir = data_dir / "raw" / day
    out_dir.mkdir(parents=True, exist_ok=True)
    items_path = out_dir / f"search-{desk}-{stamp}.json"
    items_path.write_text(json.dumps(kept, ensure_ascii=False, indent=2), encoding="utf-8")
    if dups:
        (out_dir / f"search-{desk}-{stamp}-duplicates.json").write_text(json.dumps(dups, ensure_ascii=False, indent=2), encoding="utf-8")
    summary = {"desk": desk, "items": len(kept), "duplicates": len(dups), "errors": log.counts.get("error", 0),
               "warnings": log.counts.get("warning", 0), "items_file": str(items_path), "log_file": str(log.path)}
    log("ok", desk, "search intake finished", items=len(kept), duplicates=len(dups))
    return summary


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Convert a Parallel Search response into raw news items.")
    ap.add_argument("--desk", required=True)
    ap.add_argument("--input", type=Path, required=True)
    ap.add_argument("--data", type=Path, required=True)
    ap.add_argument("--desks", type=Path, default=Path(__file__).resolve().parents[2] / "config" / "desks.yaml")
    args = ap.parse_args(argv)
    summary = run(args.desk, args.input, args.data, args.desks)
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0 if summary["errors"] == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
