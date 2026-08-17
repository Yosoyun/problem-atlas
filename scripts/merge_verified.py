#!/usr/bin/env python3
"""Problem Atlas — verify curated resources and merge them into data.js.

Takes the curation workflow output (JSON: {chapters:[{slug, resources:[...]}]}),
INDEPENDENTLY re-verifies every candidate URL (HTTP 200, not a homepage, topic
keyword present for HTML), and inserts only survivors into data.js as anchors
(so they render as green "Open" direct picks). This is the gate that stops dead
or wrong links from ever shipping.

Usage:
  python3 scripts/merge_verified.py --in candidates.json            # dry-run (verify + report)
  python3 scripts/merge_verified.py --in candidates.json --apply    # also write data.js
"""
import argparse
import json
import os
import re
import ssl
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data.js")
UA = "Mozilla/5.0 (compatible; ProblemAtlasVerify/1.0; +https://yosoyun.github.io/problem-atlas/)"

# agent type -> (our anchor type label, our category/section)
TYPE_MAP = {
    "lecture_notes":    ("Lecture notes", "Papers, PDFs & Slides"),
    "problem_set":      ("Problem set", "Problems & Solutions"),
    "past_paper":       ("Past papers", "Papers, PDFs & Slides"),
    "textbook_section": ("Reference", "Theory & Notes"),
    "article":          ("Article", "Theory & Notes"),
    "reference":        ("Reference", "Theory & Notes"),
    "simulation":       ("Tool", "Tools"),
    "video":            ("Video", "Video Lectures"),
}
STOP = set("the a an of and or for with from into about this that these those your you are "
           "complex numbers principles variation structure motion bonding molecular".split())

CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE


def load_data():
    raw = open(DATA, encoding="utf-8").read()
    return raw, json.loads(raw[raw.index("["):raw.rindex("]") + 1])


def is_homepage(final_url):
    m = re.match(r"^https?://[^/]+(/.*)?$", final_url)
    path = (m.group(1) or "/") if m else "/"
    return path.strip("/") == ""


def tokens(*texts):
    out = set()
    for t in texts:
        for w in re.findall(r"[a-z]{4,}", (t or "").lower()):
            if w not in STOP:
                out.add(w)
    return out


def verify(url, topic_tokens):
    """Return (ok, status, finalUrl, reason)."""
    req = urllib.request.Request(url, headers={"User-Agent": UA}, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=14, context=CTX) as r:
            final = r.geturl()
            ctype = r.headers.get("Content-Type", "").lower()
            if is_homepage(final):
                return (False, r.status, final, "redirected-to-homepage")
            if "pdf" in ctype or final.lower().endswith(".pdf"):
                return (True, r.status, final, "pdf-200")
            body = r.read(60000).decode("utf-8", "ignore").lower()
            title = ""
            mt = re.search(r"<title[^>]*>(.*?)</title>", body, re.S)
            if mt:
                title = mt.group(1)
            hay = title + " " + body
            if topic_tokens and not any(tok in hay for tok in topic_tokens):
                return (False, r.status, final, "topic-not-found")
            return (True, r.status, final, "html-ok")
    except urllib.error.HTTPError as e:
        return (False, e.code, url, "http-%d" % e.code)
    except Exception as e:
        return (False, 0, url, type(e).__name__)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="inp", required=True)
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args()

    cand = json.load(open(args.inp, encoding="utf-8"))
    chapters = cand["chapters"] if isinstance(cand, dict) and "chapters" in cand else cand

    raw, data = load_data()
    by_slug = {c["slug"]: c for c in data}

    grand_added = grand_seen = grand_fail = 0
    for ch in chapters:
        slug = ch["slug"]
        target = by_slug.get(slug)
        if not target:
            print("?? unknown slug:", slug); continue
        existing = {a.get("url", "") for a in target.get("anchors", [])}
        topic_tokens = tokens(ch.get("chapter", ""))
        added = 0
        print("\n== %s ==" % slug)
        for r in ch.get("resources", []):
            grand_seen += 1
            url = r.get("url", "")
            if not url.startswith("http") or url in existing:
                continue
            toks = topic_tokens | tokens(r.get("subtopic", ""), r.get("title", ""))
            ok, status, final, reason = verify(url, toks)
            mark = "OK " if ok else "DROP"
            print("  [%s] %-22s %s" % (mark, reason, url[:84]))
            if not ok:
                grand_fail += 1
                continue
            typ, cat = TYPE_MAP.get(r.get("type", "reference"), ("Reference", "Theory & Notes"))
            anchor = {
                "title": r.get("title", "")[:140],
                "url": final if final.startswith("http") else url,
                "source": r.get("source", "")[:48],
                "type": typ,
                "level": r.get("level", "Mixed"),
                "note": r.get("note", "")[:200],
                "cat": cat,
            }
            target.setdefault("anchors", []).append(anchor)
            existing.add(anchor["url"])
            added += 1
        print("  -> %d verified-direct added" % added)
        grand_added += added

    print("\n" + "=" * 56)
    print("candidates seen: %d | added: %d | rejected: %d" % (grand_seen, grand_added, grand_fail))

    if args.apply and grand_added:
        header = raw[:raw.index("window.ATLAS_DATA")]
        with open(DATA, "w", encoding="utf-8") as f:
            f.write(header)
            f.write("window.ATLAS_DATA = ")
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write(";\n")
        print("WROTE data.js (+%d anchors)" % grand_added)
    elif not args.apply:
        print("(dry-run — re-run with --apply to write data.js)")


if __name__ == "__main__":
    main()
