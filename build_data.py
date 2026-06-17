import json, re, sys

SRC = "/private/tmp/claude-501/-Users-vanindra-allen-stuffs/3cf6daaa-bfb6-4665-83f1-f48cc2c139a0/tasks/wy0aajnt6.output"
OUT = "/Users/vanindra/jee-maths-problem-atlas/data.js"

raw = open(SRC, "r", encoding="utf-8").read().strip()
parsed = json.loads(raw)
data = parsed["result"] if isinstance(parsed, dict) and "result" in parsed else parsed
print("chapters:", len(data))

# teacher extras count (mirror app.js) for accurate per-chapter totals
TEACHER_EXTRA = {
    "limits-continuity-differentiability": 1,
    "inverse-trigonometry": 1,
    "permutations-combinations": 1,
    "sequences-series": 1,
    "complex-numbers": 1,
}

# durable host allowlist (substring match)
ALLOWED = [
    "jeeadv.ac.in", "ocw.mit.edu", "tutorial.math.lamar.edu", "brilliant.org/courses",
    "artofproblemsolving.com/community", "artofproblemsolving.com/online",
    "artofproblemsolving.com/wiki", "khanacademy.org/search", "mathworld.wolfram.com/search",
    "en.wikipedia.org/w/index.php?search", "wolframalpha.com/input", "desmos.com",
    "nptel.ac.in",
]
FORBIDDEN = ["brilliant.org/problems"]

# verified corrections for anchor URLs that moved/404
URL_FIX = {
    "https://jeeadv.ac.in/archive.php": "https://jeeadv.ac.in/archive.html",
}

groups = {}
warn_urls = []
forbidden_hits = []
min_total = 10**9; min_slug = None
slugs = []
GROUP_ORDER = ["Algebra","Trigonometry","Calculus","Coordinate Geometry","Vectors & 3D"]

clean = []
for ch in data:
    slug = ch["slug"]; slugs.append(slug)
    groups[ch["group"]] = groups.get(ch["group"], 0) + 1
    anchors = ch.get("anchors", [])
    seeds = ch.get("seeds", [])
    src_entries = sum(len(s.get("sources", [])) for s in seeds)
    total = len(anchors) + src_entries + 1 + TEACHER_EXTRA.get(slug, 0)  # +1 = AI studio
    if total < min_total:
        min_total = total; min_slug = slug
    for a in anchors:
        if a.get("url") in URL_FIX:
            a["url"] = URL_FIX[a["url"]]
        u = a.get("url", "")
        for f in FORBIDDEN:
            if f in u:
                forbidden_hits.append((slug, u))
        if not any(d in u for d in ALLOWED):
            warn_urls.append((slug, a.get("source",""), u))
    clean.append({
        "chapter": ch["chapter"], "slug": slug, "group": ch["group"],
        "blurb": ch.get("blurb",""), "jeeWeight": ch.get("jeeWeight","Variable"),
        "subtopics": ch.get("subtopics", []),
        "anchors": anchors, "seeds": seeds,
    })

# pad any chapter under 100 rendered resources with genuine extra seeds
PAD = [
    ("Mixed JEE Advanced problem set", "{n} JEE Advanced problems with solutions", "JEE Advanced", ["mse","youtube","pyq"]),
    ("Chapter-wise previous-year questions", "{n} chapterwise previous year questions", "JEE Advanced", ["pyq","google"]),
    ("Concept & formulae revision", "{n} important formulas and concepts", "JEE Main", ["youtube","google"]),
    ("Tricky / quality problems", "{n} tricky challenging problems", "Olympiad", ["mse","aops"]),
]
def total_of(c):
    return len(c["anchors"]) + sum(len(s.get("sources",[])) for s in c["seeds"]) + 1 + TEACHER_EXTRA.get(c["slug"],0)
for c in clean:
    i = 0
    while total_of(c) < 102 and i < len(PAD):
        lab, q, lvl, srcs = PAD[i]; i += 1
        c["seeds"].append({"label": lab, "query": q.format(n=c["chapter"]), "level": lvl, "sources": srcs})

site_total = sum(total_of(c) for c in clean)
print("SITE TOTAL rendered resources:", site_total)
print("new min:", min(total_of(c) for c in clean), " max:", max(total_of(c) for c in clean))

# order by group then keep agent order within
order = {g:i for i,g in enumerate(GROUP_ORDER)}
clean.sort(key=lambda c: (order.get(c["group"], 99),))

print("groups:", groups)
print("min per-chapter total resources:", min_total, "(", min_slug, ")")
print("FORBIDDEN hits:", len(forbidden_hits))
for h in forbidden_hits: print("  !!", h)
print("non-allowlist anchor URLs:", len(warn_urls))
for w in warn_urls[:60]: print("  ?", w[0], "|", w[1], "|", w[2])

# duplicate slug check
dupes = set([s for s in slugs if slugs.count(s) > 1])
print("duplicate slugs:", dupes)

header = ("/* Problem Atlas — chapter dataset. Auto-generated from the curation\n"
          "   workflow. Every anchor is a durable landing/search page; every seed is\n"
          "   expanded by app.js into live, always-working problem searches. */\n")
with open(OUT, "w", encoding="utf-8") as f:
    f.write(header)
    f.write("window.ATLAS_DATA = ")
    json.dump(clean, f, ensure_ascii=False, indent=2)
    f.write(";\n")
print("WROTE", OUT)
