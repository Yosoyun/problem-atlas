#!/usr/bin/env python3
"""Problem Atlas — link-health checker (brief §18).

Only DIRECT landing pages can rot; search URLs (Google/YouTube/Stack Exchange
/Reddit search, Wikipedia go=Go) are live by construction, so we skip them.
For each direct anchor URL we record HTTP status, redirect target and content
type, and write reports/link-health.json.

By default this REPORTS (exit 0) — link rot is news, not a build break. Pass
--strict to exit non-zero when anything is broken (for a gated workflow).

Usage:
  python3 scripts/check_links.py                 # full sweep -> report
  python3 scripts/check_links.py --limit 12      # quick smoke test
  python3 scripts/check_links.py --strict        # fail on broken links
"""
import argparse
import datetime
import json
import os
import re
import ssl
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data.js")
OUT = os.path.join(ROOT, "reports", "link-health.json")

SEARCH_RE = re.compile(
    r"google\.com/search|youtube\.com/results|/search/?($|[?])"
    r"|[?&](q|search|search_query|page_search_query|query)=|go=Go",
    re.I,
)
UA = "Mozilla/5.0 (compatible; ProblemAtlasLinkCheck/1.0; +https://yosoyun.github.io/problem-atlas/)"

# mirror app.js isDeadend — these anchors are filtered out at render, so don't check them
DEADEND_SUBSTR = ["wolframalpha.com", "desmos.com", "geogebra.org/classic", "geogebra.org/calculator",
                  "jeemain.nta.nic.in", "neet.nta.nic.in", "pubmed.ncbi.nlm.nih.gov/?term=", "ncert.nic.in/textbook.php"]
DEADEND_BARE = ["https://brilliant.org/courses", "https://artofproblemsolving.com/online",
                "https://artofproblemsolving.com/community", "https://nptel.ac.in/courses", "https://ncert.nic.in/textbook.php"]


def is_deadend(u):
    if any(d in u for d in DEADEND_SUBSTR):
        return True
    return u.rstrip("/") in DEADEND_BARE


def load_data():
    raw = open(DATA, encoding="utf-8").read()
    return json.loads(raw[raw.index("["):raw.rindex("]") + 1])


def direct_urls(data):
    """Unique direct (non-search) anchor URLs, with the chapter that uses them."""
    seen, out = set(), []
    for c in data:
        for a in c.get("anchors", []):
            u = a.get("url", "")
            if not u.startswith("http") or SEARCH_RE.search(u) or is_deadend(u) or u in seen:
                continue
            seen.add(u)
            out.append({"url": u, "chapter": c.get("slug"), "source": a.get("source", "")})
    return out


def check(url, ctx, timeout=12):
    req = urllib.request.Request(url, headers={"User-Agent": UA}, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as r:
            return {"status": r.status, "finalUrl": r.geturl(),
                    "contentType": r.headers.get("Content-Type", ""), "state": "ok"}
    except urllib.error.HTTPError as e:
        state = "registration_required" if e.code in (401, 403) else "broken"
        return {"status": e.code, "finalUrl": url, "contentType": "", "state": state}
    except Exception as e:
        return {"status": 0, "finalUrl": url, "contentType": "",
                "state": "error", "error": type(e).__name__}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--strict", action="store_true")
    args = ap.parse_args()

    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE  # some edu hosts have odd chains; we only check reachability

    targets = direct_urls(load_data())
    if args.limit:
        targets = targets[:args.limit]

    results, broken = [], []
    for i, t in enumerate(targets, 1):
        res = check(t["url"], ctx)
        row = {**t, **res}
        results.append(row)
        if res["state"] in ("broken", "error"):
            broken.append(row)
        print("[%3d/%3d] %-6s %s" % (i, len(targets), res.get("status") or res["state"], t["url"][:90]))

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    report = {
        "checkedAt": datetime.date.today().isoformat(),
        "totalDirect": len(targets),
        "ok": sum(1 for r in results if r["state"] == "ok"),
        "registrationRequired": sum(1 for r in results if r["state"] == "registration_required"),
        "broken": len(broken),
        "results": results,
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print("-" * 56)
    print("checked %d direct links: %d ok, %d login-walled, %d broken -> %s"
          % (report["totalDirect"], report["ok"], report["registrationRequired"],
             report["broken"], os.path.relpath(OUT, ROOT)))
    if args.strict and broken:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
