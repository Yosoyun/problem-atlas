import json, re, time, subprocess, urllib.parse
from urllib.parse import urlparse

PATH = "/Users/vanindra/jee-maths-problem-atlas/data.js"
raw = open(PATH, encoding="utf-8").read()
header = raw[:raw.index("[")]                     # "window.ATLAS_DATA = "
data = json.loads(raw[raw.index("["):raw.rindex("]") + 1])

def topic_key(name):
    s = re.sub(r"\([^)]*\)", " ", name)
    s = s.replace("&", " and ")
    return re.sub(r"\s+", " ", s).strip()

def _curl(u):
    return subprocess.run(["curl", "-s", "--max-time", "12", "-A", "ProblemAtlas/1.0 (educational)", u],
                          capture_output=True, text=True, timeout=15).stdout

def wiki_url(topic):
    # 1) opensearch — exact-title match, highest quality
    try:
        d = json.loads(_curl("https://en.wikipedia.org/w/api.php?action=opensearch&limit=1&namespace=0&format=json&search=" + urllib.parse.quote(topic)))
        if isinstance(d, list) and len(d) >= 4 and d[3]:
            return d[3][0]
    except Exception:
        pass
    # 2) REST search — best match for ANY query (covers compound/science chapter names)
    try:
        d = json.loads(_curl("https://en.wikipedia.org/w/rest.php/v1/search/page?limit=1&q=" + urllib.parse.quote(topic)))
        pages = d.get("pages") if isinstance(d, dict) else None
        if pages:
            return "https://en.wikipedia.org/wiki/" + urllib.parse.quote(pages[0]["key"])
    except Exception as e:
        print("  wiki fail:", topic, e)
    return None

# hosts where a bare root / book-cover is useless → rewrite to a site-scoped search
BARE_HOSTS = ["libretexts.org", "chemguide.co.uk", "masterorganicchemistry.com",
              "feynmanlectures.caltech.edu", "hyperphysics.phy-astr.gsu.edu",
              "biologyonline.com", "openstax.org", "rsc.org", "cut-the-knot.org",
              "betterexplained.com", "physicsclassroom.com", "tutorial.math.lamar.edu"]

wiki_set = ncert_dropped = rewritten = 0
for ch in data:
    topic = topic_key(ch["chapter"])
    # 1) direct Wikipedia article (retry — Wikipedia rate-limits rapid calls)
    if not ch.get("wiki"):
        w = None
        for _ in range(4):
            w = wiki_url(topic)
            if w:
                break
            time.sleep(0.8)
        if w:
            ch["wiki"] = w; wiki_set += 1
        time.sleep(0.35)
    # 2) clean anchors: drop dead NCERT form; rewrite book-roots/homepages to site-scoped search
    new_anchors = []
    for a in ch.get("anchors", []):
        url = a.get("url", "")
        if "ncert.nic.in/textbook.php" in url:
            ncert_dropped += 1
            continue  # engine also blocks it; remove from data so it never ships
        p = urlparse(url); host = p.netloc.replace("www.", ""); path = p.path or ""
        book_root = "openstax.org/details/books/" in url
        bare = any(h in host for h in BARE_HOSTS) and path in ("", "/")
        if book_root or bare:
            a = dict(a); a["url"] = "https://www.google.com/search?q=" + urllib.parse.quote_plus(topic + " site:" + host)
            rewritten += 1
        new_anchors.append(a)
    ch["anchors"] = new_anchors

print(f"wiki articles baked: {wiki_set}/{len(data)}")
print(f"dead NCERT anchors removed: {ncert_dropped}")
print(f"book-root/homepage anchors rewritten: {rewritten}")

with open(PATH, "w", encoding="utf-8") as f:
    f.write(header)
    json.dump(data, f, ensure_ascii=False, indent=2)
    f.write(";\n")
print("WROTE", PATH)
