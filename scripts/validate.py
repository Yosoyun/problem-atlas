#!/usr/bin/env python3
"""Problem Atlas — data integrity validator.

Reads the live data file (data.js) WITHOUT executing JavaScript, mirrors the
frontend's resource-expansion rules, and checks the invariants that keep the
site honest:

  * unique chapter slugs
  * required fields present on every chapter
  * well-formed anchor URLs (http/https only)
  * no forbidden / disallowed hosts
  * no duplicate anchor URLs inside a single chapter
  * known subjects; reports unknown groups/levels as warnings
  * quantifies "padding" — seed sources the frontend silently discards

HARD failures exit 1 (so CI fails). Soft issues print as warnings.
This is the check that lets the UI honestly say "regularly checked".

Usage:  python3 scripts/validate.py
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data.js")

# --- mirror of app.js expansion rules (keep in sync with app.js) ---------
DISCARDED_SEED_SOURCES = {"google", "pyq", "youtube"}  # expandChapter skips these
FIXED_SHORTCUTS = {  # chapterShortcuts() count, by subject (theory4 + papers5 + video2 + community2 + tools)
    "Mathematics": 4 + 5 + 2 + 2 + 2,
    "Physics":     4 + 5 + 2 + 2 + 2,
    "Chemistry":   4 + 5 + 2 + 2 + 3,
    "Biology":     4 + 5 + 2 + 2 + 2,
}
TEACHER_EXTRA_SLUGS = {
    "limits-continuity-differentiability", "inverse-trigonometry",
    "permutations-combinations", "sequences-series", "complex-numbers",
}
PAD_LABELS = {
    "Mixed JEE Advanced problem set",
    "Chapter-wise previous-year questions",
    "Concept & formulae revision",
    "Tricky / quality problems",
}
ALLOWED_SUBJECTS = {"Mathematics", "Physics", "Chemistry", "Biology"}
ALLOWED_LEVELS = {
    "Foundation", "JEE Main", "JEE Advanced", "NEET", "Olympiad",
    "Standard", "Advanced", "Mixed", "",
}
FORBIDDEN_URL_SUBSTR = ["brilliant.org/problems"]  # deleted community problems → dead

REQUIRED_FIELDS = ["chapter", "slug", "subject", "group"]


def load_data():
    raw = open(DATA, encoding="utf-8").read()
    start = raw.index("[")
    end = raw.rindex("]")
    return json.loads(raw[start:end + 1])


def main():
    data = load_data()
    errors, warnings = [], []

    # 1. unique slugs
    slugs = [c.get("slug", "") for c in data]
    dupes = sorted({s for s in slugs if slugs.count(s) > 1})
    if dupes:
        errors.append("duplicate slugs: %s" % dupes)

    discarded_seed_instances = 0
    pad_seed_count = 0
    per_chapter_counts = []

    for c in data:
        where = c.get("slug") or c.get("chapter") or "?"
        # 2. required fields
        for f in REQUIRED_FIELDS:
            if not c.get(f):
                errors.append("%s: missing required field '%s'" % (where, f))
        # 3. subject sanity
        if c.get("subject") not in ALLOWED_SUBJECTS:
            warnings.append("%s: unknown subject '%s'" % (where, c.get("subject")))

        # 4. anchors: URL well-formed, not forbidden, no in-chapter dupes
        seen_anchor_urls = set()
        for a in c.get("anchors", []):
            u = a.get("url", "")
            if not re.match(r"^https?://", u):
                errors.append("%s: malformed anchor URL %r" % (where, u))
            for bad in FORBIDDEN_URL_SUBSTR:
                if bad in u:
                    errors.append("%s: forbidden host in %r" % (where, u))
            if u in seen_anchor_urls:
                warnings.append("%s: duplicate anchor URL %r" % (where, u))
            seen_anchor_urls.add(u)
            if a.get("level") not in ALLOWED_LEVELS:
                warnings.append("%s: anchor unusual level '%s'" % (where, a.get("level")))

        # 5. seeds: quantify padding + discarded sources
        rendered_seed_sources = 0
        for s in c.get("seeds", []):
            if s.get("label") in PAD_LABELS:
                pad_seed_count += 1
            for src in s.get("sources", []):
                if src in DISCARDED_SEED_SOURCES:
                    discarded_seed_instances += 1
                else:
                    rendered_seed_sources += 1
            if s.get("level") not in ALLOWED_LEVELS:
                warnings.append("%s: seed unusual level '%s'" % (where, s.get("level")))

        # approximate rendered-resource count (informational; the live app is the
        # source of truth via _res.length — this is a sanity lower bound)
        approx = (
            1  # AI studio
            + (1 if c.get("slug") in TEACHER_EXTRA_SLUGS else 0)
            + FIXED_SHORTCUTS.get(c.get("subject"), 17)
            + len(c.get("anchors", []))
            + rendered_seed_sources
        )
        per_chapter_counts.append((where, approx))

    # ---- report ----------------------------------------------------------
    by_subject = {}
    for c in data:
        by_subject[c.get("subject", "?")] = by_subject.get(c.get("subject", "?"), 0) + 1

    print("Problem Atlas — data validation")
    print("=" * 48)
    print("chapters: %d   %s" % (len(data), by_subject))
    counts = [n for _, n in per_chapter_counts]
    if counts:
        print("approx rendered resources/chapter: min %d, max %d, avg %d, total ~%d"
              % (min(counts), max(counts), sum(counts) // len(counts), sum(counts)))
    print("padding seeds present: %d   (frontend-discarded seed sources: %d)"
          % (pad_seed_count, discarded_seed_instances))
    print("-" * 48)

    for w in warnings:
        print("WARN  " + w)
    for e in errors:
        print("FAIL  " + e)

    print("-" * 48)
    if errors:
        print("RESULT: FAIL (%d error(s), %d warning(s))" % (len(errors), len(warnings)))
        return 1
    print("RESULT: PASS (%d warning(s))" % len(warnings))
    return 0


if __name__ == "__main__":
    sys.exit(main())
