"""Duplicate handling for raw items.

Two different things are kept apart on purpose:
* duplicate   – the SAME article seen twice (same canonical URL, or a near-identical title from the
                same source). Later copies get `duplicate_of` and are dropped from the kept list.
* same title  – near-identical titles from DIFFERENT sources. Usually one wire story copied by
                several outlets. Both are kept, linked through `same_title_as`, so the fact-checking
                stage does not count them as independent confirmation.
"""
from __future__ import annotations

from .normalize import title_similarity

SAME_SOURCE_TITLE_THRESHOLD = 0.9
CROSS_SOURCE_TITLE_THRESHOLD = 0.85


def dedupe(items: list[dict]) -> tuple[list[dict], list[dict]]:
    """Return (kept, duplicates). Input order decides which copy is the original. Items are updated in place."""
    kept: list[dict] = []
    duplicates: list[dict] = []
    by_url: dict[str, dict] = {}

    for item in items:
        original = by_url.get(item["canonical_url"])
        if original is None:
            original = next((k for k in kept if k["source_id"] == item["source_id"]
                             and title_similarity(k["title"], item["title"]) >= SAME_SOURCE_TITLE_THRESHOLD), None)
        if original is not None:
            item["duplicate_of"] = original["id"]
            duplicates.append(item)
            continue
        for other in kept:
            if other["source_id"] != item["source_id"] and title_similarity(other["title"], item["title"]) >= CROSS_SOURCE_TITLE_THRESHOLD:
                item["same_title_as"].append(other["id"])
                other["same_title_as"].append(item["id"])
        by_url[item["canonical_url"]] = item
        kept.append(item)
    return kept, duplicates
