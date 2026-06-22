#!/usr/bin/env python3
"""Problem Atlas — in-place data cleaner (correctness / anti-padding).

The original curation-workflow inputs are gone, so data.js IS the source of
truth now. This operates directly on data.js and removes only material that
the frontend already discards or de-duplicates — so the rendered site is
unchanged, the file is far smaller, and the data stops lying about its size.

What it removes (all render-neutral, except padding which is the point):
  1. seed SOURCES the frontend skips ("google", "pyq", "youtube") — these
     render zero cards (see expandChapter in app.js). ~8k inert entries.
  2. seeds left with no sources after (1).
  3. explicit padding seeds (the 4 PAD_LABELS) injected only to reach a
     count target — brief §3 "stop padding".
  4. duplicate anchor URLs inside the same chapter (frontend already
     de-dupes by URL, so no card is lost) — brief §19.

Run:  python3 scripts/clean_data.py
Then: python3 scripts/validate.py   (should report padding seeds: 0)
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data.js")


def clean_blurb(b):
    """Remove indefensible claims from rendered blurbs (brief §1.3): no
    'always-working', 'link-rot-proof', 'self-refreshing', and no inflated
    '~100 resources' counts. Keep the real, descriptive content."""
    if not b:
        return b
    s = b
    s = s.replace(", link-rot-proof", "").replace("link-rot-proof ", "")
    s = s.replace(", self-refreshing", "").replace("self-refreshing ", "live ")
    s = s.replace(", always-working", "").replace(" always-working", "").replace("always-working ", "")
    s = re.sub(r"~?100\+?\s+(resources|links)", r"carefully chosen \1", s)
    s = re.sub(r"\s{2,}", " ", s).replace(" ,", ",").replace(" .", ".")
    return s.strip()

DISCARDED_SEED_SOURCES = {"google", "pyq", "youtube"}
PAD_LABELS = {
    "Mixed JEE Advanced problem set",
    "Chapter-wise previous-year questions",
    "Concept & formulae revision",
    "Tricky / quality problems",
}
HEADER = (
    "/* Problem Atlas — PCMB resource dataset (data.js is the source of truth).\n"
    "   Each anchor is a durable landing/search page; each seed is expanded by\n"
    "   app.js into live topic searches. Cleaned by scripts/clean_data.py — only\n"
    "   render-neutral bloat and padding are stripped. Validate: scripts/validate.py */\n"
)


def main():
    raw = open(DATA, encoding="utf-8").read()
    data = json.loads(raw[raw.index("["):raw.rindex("]") + 1])

    removed_sources = removed_seeds = removed_pads = removed_dupe_anchors = 0
    cleaned_blurbs = 0
    for c in data:
        nb = clean_blurb(c.get("blurb", ""))
        if nb != c.get("blurb", ""):
            cleaned_blurbs += 1
        c["blurb"] = nb
        # 4. de-dupe anchors by URL (keep first occurrence)
        seen, kept = set(), []
        for a in c.get("anchors", []):
            u = a.get("url", "")
            if u in seen:
                removed_dupe_anchors += 1
                continue
            seen.add(u)
            kept.append(a)
        c["anchors"] = kept

        # 1-3. strip discarded sources, drop emptied + padding seeds
        new_seeds = []
        for s in c.get("seeds", []):
            if s.get("label") in PAD_LABELS:
                removed_pads += 1
                continue
            srcs = []
            for src in s.get("sources", []):
                if src in DISCARDED_SEED_SOURCES:
                    removed_sources += 1
                else:
                    srcs.append(src)
            if not srcs:
                removed_seeds += 1
                continue
            s["sources"] = srcs
            new_seeds.append(s)
        c["seeds"] = new_seeds

    before = len(raw)
    with open(DATA, "w", encoding="utf-8") as f:
        f.write(HEADER)
        f.write("window.ATLAS_DATA = ")
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write(";\n")
    after = os.path.getsize(DATA)

    print("cleaned data.js")
    print("  discarded seed-sources removed : %d" % removed_sources)
    print("  emptied seeds removed          : %d" % removed_seeds)
    print("  padding seeds removed          : %d" % removed_pads)
    print("  duplicate anchors removed      : %d" % removed_dupe_anchors)
    print("  blurbs de-hyped                : %d" % cleaned_blurbs)
    print("  file size: %d -> %d bytes  (-%.0f%%)"
          % (before, after, 100 * (before - after) / before))


if __name__ == "__main__":
    main()
