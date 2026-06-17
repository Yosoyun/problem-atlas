import json, os

TASKS = "/private/tmp/claude-501/-Users-vanindra-allen-stuffs/3cf6daaa-bfb6-4665-83f1-f48cc2c139a0/tasks"
MATHS_SRC = os.path.join(TASKS, "wy0aajnt6.output")   # Mathematics curation workflow
PC_SRC    = os.path.join(TASKS, "w3pl9w103.output")   # Physics + Chemistry curation workflow
OUT = "/Users/vanindra/jee-maths-problem-atlas/data.js"

def load_result(path):
    if not os.path.exists(path):
        return []
    try:
        parsed = json.loads(open(path, encoding="utf-8").read().strip())
    except Exception as e:
        print("  (skipping %s — not ready: %s)" % (os.path.basename(path), e))
        return []
    return parsed["result"] if isinstance(parsed, dict) and "result" in parsed else parsed

maths = load_result(MATHS_SRC)
for c in maths:
    c["subject"] = "Mathematics"          # maths workflow predates the subject field
pc = load_result(PC_SRC)                  # already carries subject = Physics / Chemistry

data = maths + pc
print("loaded:", len(maths), "maths +", len(pc), "physics/chem =", len(data))

# teacher extras count (mirror app.js) for accurate per-chapter totals
TEACHER_EXTRA = {
    "limits-continuity-differentiability": 1, "inverse-trigonometry": 1,
    "permutations-combinations": 1, "sequences-series": 1, "complex-numbers": 1,
}
URL_FIX = { "https://jeeadv.ac.in/archive.php": "https://jeeadv.ac.in/archive.html" }
FORBIDDEN = ["brilliant.org/problems"]

SUBJECT_ORDER = ["Mathematics", "Physics", "Chemistry"]
GROUP_ORDER = {
    "Mathematics": ["Algebra", "Trigonometry", "Calculus", "Coordinate Geometry", "Vectors & 3D"],
    "Physics": ["General Physics", "Mechanics", "Waves & Thermal", "Electromagnetism", "Optics & Modern"],
    "Chemistry": ["Physical Chemistry", "Inorganic Chemistry", "Organic Chemistry"],
}

PAD = [
    ("Mixed JEE Advanced problem set", "{n} JEE Advanced problems with solutions", "JEE Advanced", ["mse","youtube","pyq"]),
    ("Chapter-wise previous-year questions", "{n} chapterwise previous year questions", "JEE Advanced", ["pyq","google"]),
    ("Concept & formulae revision", "{n} important formulas and concepts", "JEE Main", ["youtube","google"]),
    ("Tricky / quality problems", "{n} tricky challenging problems", "Olympiad", ["youtube","google"]),
]
SUBJ_PSRC = {"Mathematics": "mse", "Physics": "pse", "Chemistry": "cse"}

def total_of(c):
    return len(c["anchors"]) + sum(len(s.get("sources", [])) for s in c["seeds"]) + 1 + TEACHER_EXTRA.get(c["slug"], 0)

forbidden_hits, warn, slugs = [], 0, []
clean = []
for ch in data:
    slugs.append(ch["slug"])
    for a in ch.get("anchors", []):
        if a.get("url") in URL_FIX:
            a["url"] = URL_FIX[a["url"]]
        if any(f in a.get("url", "") for f in FORBIDDEN):
            forbidden_hits.append((ch["slug"], a["url"]))
    # pad to >=102 rendered resources, using the subject's primary SE source
    psrc = SUBJ_PSRC.get(ch.get("subject"), "mse")
    i = 0
    while total_of(ch) < 102 and i < len(PAD):
        lab, q, lvl, srcs = PAD[i]; i += 1
        srcs = [psrc if s == "mse" else s for s in srcs]
        ch["seeds"].append({"label": lab, "query": q.format(n=ch["chapter"]), "level": lvl, "sources": srcs})
    clean.append({
        "chapter": ch["chapter"], "slug": ch["slug"], "subject": ch.get("subject", "Mathematics"),
        "group": ch["group"], "blurb": ch.get("blurb", ""), "jeeWeight": ch.get("jeeWeight", "Variable"),
        "subtopics": ch.get("subtopics", []), "anchors": ch.get("anchors", []), "seeds": ch.get("seeds", []),
    })

clean.sort(key=lambda c: (
    SUBJECT_ORDER.index(c["subject"]) if c["subject"] in SUBJECT_ORDER else 99,
    GROUP_ORDER.get(c["subject"], []).index(c["group"]) if c["group"] in GROUP_ORDER.get(c["subject"], []) else 99,
))

by_subject = {}
for c in clean:
    by_subject[c["subject"]] = by_subject.get(c["subject"], 0) + 1
print("by subject:", by_subject)
print("SITE TOTAL rendered resources:", sum(total_of(c) for c in clean))
if clean:
    print("per-chapter min:", min(total_of(c) for c in clean), "max:", max(total_of(c) for c in clean))
print("FORBIDDEN hits:", forbidden_hits)
dupes = sorted({s for s in slugs if slugs.count(s) > 1})
print("duplicate slugs:", dupes)

header = ("/* Problem Atlas — JEE Advanced PCM dataset. Auto-generated from the\n"
          "   curation workflows. Every anchor is a durable landing/search page;\n"
          "   every seed is expanded by app.js into live, always-working searches. */\n")
with open(OUT, "w", encoding="utf-8") as f:
    f.write(header)
    f.write("window.ATLAS_DATA = ")
    json.dump(clean, f, ensure_ascii=False, indent=2)
    f.write(";\n")
print("WROTE", OUT)
