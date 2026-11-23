"""Run one intake pass: fetch every enabled source, parse, de-duplicate, write results and a log.

Usage:
    python -m intake.run_intake --sources config/sources.yaml --data ../data

Writes:
    <data>/raw/YYYY-MM-DD/items-<HHMMSS>.json        kept items
    <data>/raw/YYYY-MM-DD/duplicates-<HHMMSS>.json   dropped duplicates (kept for audit)
    <data>/logs/intake-YYYY-MM-DD.jsonl              one line per event (ok / warning / error)

A source that fails is logged and skipped; nothing is written in its place.
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests
import yaml

from .dedupe import dedupe
from .parse_feed import Source, parse_feed

USER_AGENT = "GlobalNewsroomIntake/0.1 (+rss reader)"
TIMEOUT_S = 20


def load_sources(path: Path) -> list[Source]:
    data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    return [Source(**s) for s in data.get("sources", [])]


def fetch(feed_url: str, base: Path) -> bytes:
    if feed_url.startswith(("http://", "https://")):
        r = requests.get(feed_url, timeout=TIMEOUT_S, headers={"User-Agent": USER_AGENT})
        r.raise_for_status()
        return r.content
    path = Path(feed_url.removeprefix("file://"))
    return (path if path.is_absolute() else base / path).read_bytes()


class Log:
    def __init__(self, path: Path):
        self.path = path
        path.parent.mkdir(parents=True, exist_ok=True)
        self.counts = {"ok": 0, "warning": 0, "error": 0}

    def __call__(self, level: str, source: str | None, message: str, **extra):
        self.counts[level] = self.counts.get(level, 0) + 1
        rec = {"at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "stage": "intake",
               "level": level, "source": source, "message": message, **extra}
        with self.path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")


def run(sources_path: Path, data_dir: Path, now: datetime | None = None) -> dict:
    now = now or datetime.now(timezone.utc)
    day, stamp = now.strftime("%Y-%m-%d"), now.strftime("%H%M%S")
    log = Log(data_dir / "logs" / f"intake-{day}.jsonl")
    all_items: list[dict] = []
    sources = [s for s in load_sources(sources_path) if s.enabled]
    if not sources:
        log("error", None, "no enabled sources in config")

    for src in sources:
        try:
            content = fetch(src.feed_url, sources_path.parent)
        except Exception as e:  # network, HTTP status, missing file
            log("error", src.id, f"fetch failed: {type(e).__name__}: {e}")
            continue
        res = parse_feed(content, src, now)
        for w in res.warnings:
            log("warning", src.id, w)
        for e in res.errors:
            log("error", src.id, e)
        if res.items:
            log("ok", src.id, f"{len(res.items)} items parsed")
        all_items.extend(res.items)

    kept, dups = dedupe(all_items)
    out_dir = data_dir / "raw" / day
    out_dir.mkdir(parents=True, exist_ok=True)
    items_path = out_dir / f"items-{stamp}.json"
    dups_path = out_dir / f"duplicates-{stamp}.json"
    items_path.write_text(json.dumps(kept, ensure_ascii=False, indent=2), encoding="utf-8")
    dups_path.write_text(json.dumps(dups, ensure_ascii=False, indent=2), encoding="utf-8")
    summary = {"sources": len(sources), "items": len(kept), "duplicates": len(dups),
               "errors": log.counts.get("error", 0), "warnings": log.counts.get("warning", 0),
               "items_file": str(items_path), "log_file": str(log.path)}
    log("ok", None, "intake finished", **{k: v for k, v in summary.items() if k not in ("items_file", "log_file")})
    return summary


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--sources", type=Path, required=True)
    ap.add_argument("--data", type=Path, required=True)
    args = ap.parse_args(argv)
    summary = run(args.sources, args.data)
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 1 if summary["sources"] and summary["errors"] >= summary["sources"] and summary["items"] == 0 else 0


if __name__ == "__main__":
    sys.exit(main())
