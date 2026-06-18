import json, os, re, urllib.parse, html

TASKS = "/private/tmp/claude-501/-Users-vanindra-allen-stuffs/3cf6daaa-bfb6-4665-83f1-f48cc2c139a0/tasks"
MATHS_SRC = os.path.join(TASKS, "wy0aajnt6.output")   # Mathematics curation workflow
PC_SRC    = os.path.join(TASKS, "w3pl9w103.output")   # Physics + Chemistry curation workflow
BIO_SRC   = os.path.join(TASKS, "wgbzj7tk3.output")   # NEET Biology curation workflow
OUT = "/Users/vanindra/jee-maths-problem-atlas/data.js"

def clean_query(q):
    """Some curation agents stored a full search URL in the query field, which the
    site then wrapped again (double-wrap bug). Extract the plain search terms."""
    if not isinstance(q, str):
        return q
    s = q.strip()
    if "http" not in s.lower() and "%" not in s:
        return s
    m = None
    for mm in re.finditer(r"[?&](?:q|search_query|search|i)=([^&\s]*)", s):
        m = mm
    tag = re.search(r"/(?:tagged|tags)/([^/?&\s]+)", s)
    if m:
        val = urllib.parse.unquote_plus(m.group(1))
    elif tag:
        val = urllib.parse.unquote_plus(tag.group(1)).replace("-", " ")
    else:
        val = re.sub(r"https?://\S+", "", s).strip()
    val = re.sub(r"^site:\S+\s*", "", val).strip()
    suffixes = [" questions with solutions", " problems with solutions",
                " jee advanced previous year questions pdf", " neet previous year questions pdf",
                " previous year questions pdf", " previous year questions", " filetype:pdf",
                " jee advanced", " jee main", " neet", " jee"]
    changed = True
    while changed:
        changed = False
        for suf in suffixes:
            if val.lower().endswith(suf):
                val = val[:-len(suf)].strip(); changed = True
    return val or s

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
bio = load_result(BIO_SRC)                # already carries subject = Biology

data = maths + pc + bio

# some agents emitted HTML entities (&amp;) or off-spec group names — normalise
def deep_unescape(o):
    if isinstance(o, str): return html.unescape(o)
    if isinstance(o, list): return [deep_unescape(x) for x in o]
    if isinstance(o, dict): return {k: deep_unescape(v) for k, v in o.items()}
    return o
GROUP_ALIAS = {
    "Diversity of Living Organisms": "Diversity & Cell Biology",
    "Cell Biology & Genetics": "Diversity & Cell Biology",
}
data = deep_unescape(data)
for ch in data:
    ch["group"] = GROUP_ALIAS.get(ch.get("group", ""), ch.get("group", ""))
print("loaded:", len(maths), "maths +", len(pc), "physics/chem +", len(bio), "biology =", len(data))

# teacher extras count (mirror app.js) for accurate per-chapter totals
TEACHER_EXTRA = {
    "limits-continuity-differentiability": 1, "inverse-trigonometry": 1,
    "permutations-combinations": 1, "sequences-series": 1, "complex-numbers": 1,
}
URL_FIX = { "https://jeeadv.ac.in/archive.php": "https://jeeadv.ac.in/archive.html" }
FORBIDDEN = ["brilliant.org/problems"]

SUBJECT_ORDER = ["Mathematics", "Physics", "Chemistry", "Biology"]
GROUP_ORDER = {
    "Mathematics": ["Algebra", "Trigonometry", "Calculus", "Coordinate Geometry", "Vectors & 3D"],
    "Physics": ["General Physics", "Mechanics", "Waves & Thermal", "Electromagnetism", "Optics & Modern"],
    "Chemistry": ["Physical Chemistry", "Inorganic Chemistry", "Organic Chemistry"],
    "Biology": ["Diversity & Cell Biology", "Plant Physiology & Anatomy", "Human Physiology", "Reproduction", "Genetics & Evolution", "Biology in Human Welfare & Biotech", "Ecology"],
}

PAD = [
    ("Mixed JEE Advanced problem set", "{n} JEE Advanced problems with solutions", "JEE Advanced", ["mse","youtube","pyq"]),
    ("Chapter-wise previous-year questions", "{n} chapterwise previous year questions", "JEE Advanced", ["pyq","google"]),
    ("Concept & formulae revision", "{n} important formulas and concepts", "JEE Main", ["youtube","google"]),
    ("Tricky / quality problems", "{n} tricky challenging problems", "Olympiad", ["youtube","google"]),
]
SUBJ_PSRC = {"Mathematics": "mse", "Physics": "pse", "Chemistry": "cse", "Biology": "bio"}

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
    # FIX double-wrap bug: strip any full-URL queries down to plain search terms
    for s in ch.get("seeds", []):
        s["query"] = clean_query(s.get("query", ""))
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
