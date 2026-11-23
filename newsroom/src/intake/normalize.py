"""Text and URL normalisation shared by intake stages."""
from __future__ import annotations

import hashlib
import html
import re
import unicodedata
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

# Query parameters that only track the reader; they never change which article a link points to.
TRACKING_PARAMS = {"fbclid", "gclid", "dclid", "mc_cid", "mc_eid", "igshid", "ref", "ref_src", "cmpid", "ocid", "s_cid"}
TRACKING_PREFIXES = ("utm_",)

_TAG_RE = re.compile(r"<[^>]+>")
_SPACE_RE = re.compile(r"\s+")
_ARABIC_DIACRITICS = re.compile(r"[ؐ-ًؚ-ٰٟۖ-ۭـ]")  # harakat + tatweel


def canonical_url(url: str) -> str:
    """Lower-case scheme/host, drop 'www.', fragment, tracking params and trailing slash; sort the rest."""
    parts = urlsplit(url.strip())
    host = (parts.hostname or "").lower()
    if host.startswith("www."):
        host = host[4:]
    if parts.port and not ((parts.scheme == "http" and parts.port == 80) or (parts.scheme == "https" and parts.port == 443)):
        host = f"{host}:{parts.port}"
    query = [(k, v) for k, v in parse_qsl(parts.query, keep_blank_values=True)
             if k.lower() not in TRACKING_PARAMS and not k.lower().startswith(TRACKING_PREFIXES)]
    path = parts.path.rstrip("/") or "/"
    scheme = "https" if parts.scheme in ("http", "https") else parts.scheme
    return urlunsplit((scheme, host, path, urlencode(sorted(query)), ""))


def item_id(canonical: str) -> str:
    return "raw_" + hashlib.sha1(canonical.encode("utf-8")).hexdigest()[:16]


def strip_html(text: str | None) -> str:
    if not text:
        return ""
    return _SPACE_RE.sub(" ", html.unescape(_TAG_RE.sub(" ", text))).strip()


def normalize_title(title: str) -> str:
    """Comparison key for titles in Arabic, Spanish, French or English."""
    t = unicodedata.normalize("NFKC", title).lower()
    t = _ARABIC_DIACRITICS.sub("", t)
    t = re.sub("[إأآٱ]", "ا", t).replace("ى", "ي").replace("ة", "ه").replace("ؤ", "و").replace("ئ", "ي")
    t = "".join(c for c in unicodedata.normalize("NFKD", t) if not unicodedata.combining(c))  # é -> e, ñ -> n
    t = re.sub(r"[^\w\s]", " ", t)
    return _SPACE_RE.sub(" ", t).strip()


def title_similarity(a: str, b: str) -> float:
    """Jaccard similarity of word sets after normalisation (0..1)."""
    wa, wb = set(normalize_title(a).split()), set(normalize_title(b).split())
    if not wa or not wb:
        return 0.0
    return len(wa & wb) / len(wa | wb)
