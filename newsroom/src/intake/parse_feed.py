"""Turn one RSS/Atom document into RawItem records. Never invents data: a missing field stays empty/null and is flagged."""
from __future__ import annotations

import calendar
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone

import feedparser

from .normalize import canonical_url, item_id, strip_html


@dataclass
class Source:
    id: str
    name: str
    feed_url: str
    language: str
    desk: str
    country: list[str]
    owner: str | None = None
    max_age_hours: int = 48
    enabled: bool = True


@dataclass
class ParseResult:
    items: list[dict] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


def _iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).replace(microsecond=0).strftime("%Y-%m-%dT%H:%M:%SZ")


def _entry_time(entry) -> datetime | None:
    # feedparser converts *_parsed to UTC struct_time; calendar.timegm reads it as UTC.
    for key in ("published_parsed", "updated_parsed"):
        st = entry.get(key)
        if st:
            return datetime.fromtimestamp(calendar.timegm(st), tz=timezone.utc)
    return None


def parse_feed(content: bytes | str, source: Source, fetched_at: datetime) -> ParseResult:
    result = ParseResult()
    parsed = feedparser.parse(content)
    entries = parsed.get("entries") or []

    if parsed.get("bozo") and not entries:
        result.errors.append(f"{source.id}: feed could not be parsed ({type(parsed.get('bozo_exception')).__name__}: {parsed.get('bozo_exception')})")
        return result
    if parsed.get("bozo"):
        result.warnings.append(f"{source.id}: feed is malformed but readable ({parsed.get('bozo_exception')})")
    if not entries:
        result.warnings.append(f"{source.id}: feed has no entries")
        return result

    for n, entry in enumerate(entries):
        link = (entry.get("link") or "").strip()
        title = strip_html(entry.get("title"))
        if not link or not title:
            result.warnings.append(f"{source.id}: entry #{n} skipped (missing {'link' if not link else 'title'})")
            continue
        canon = canonical_url(link)
        published = _entry_time(entry)
        summary = strip_html(entry.get("summary") or entry.get("description"))
        flags: list[str] = []
        if published is None:
            flags.append("no_date")
        elif published - fetched_at > timedelta(hours=1):
            flags.append("future_date")
        elif fetched_at - published > timedelta(hours=source.max_age_hours):
            flags.append("stale")
        if not summary:
            flags.append("no_summary")
        result.items.append({
            "id": item_id(canon),
            "source_id": source.id,
            "source_name": source.name,
            "feed_url": source.feed_url,
            "url": link,
            "canonical_url": canon,
            "title": title,
            "summary": summary,
            "language": source.language,
            "desk": source.desk,
            "country": list(source.country),
            "published_at": _iso(published) if published else None,
            "published_at_raw": entry.get("published") or entry.get("updated"),
            "fetched_at": _iso(fetched_at),
            "flags": flags,
            "duplicate_of": None,
            "same_title_as": [],
        })
    return result
