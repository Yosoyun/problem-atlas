"""Generate static, crawlable per-chapter landing pages + sitemap + robots,
and inject a crawlable chapter index + WebSite JSON-LD into index.html.
The interactive SPA (index.html + app.js) is untouched; these pages are
content-rich SEO entry points that funnel to the app."""
import json, os, re, html

ROOT = "/Users/vanindra/jee-maths-problem-atlas"
SITE = "https://yosoyun.github.io/problem-atlas"
raw = open(os.path.join(ROOT, "data.js"), encoding="utf-8").read()
data = json.loads(raw[raw.index("["):raw.rindex("]") + 1])

DEAD = ["wolframalpha.com", "desmos.com", "geogebra.org/classic", "geogebra.org/calculator",
        "jeemain.nta.nic.in", "neet.nta.nic.in", "pubmed.ncbi.nlm.nih.gov/?term=", "ncert.nic.in/textbook.php"]
DEAD_BARE = ["https://brilliant.org/courses", "https://artofproblemsolving.com/online",
             "https://artofproblemsolving.com/community", "https://nptel.ac.in/courses"]
def dead(u):
    if not u: return True
    if any(d in u for d in DEAD): return True
    return u.rstrip("/") in DEAD_BARE

e = html.escape
GLYPH = ('<svg class="brand-glyph" width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">'
         '<rect x="3" y="3" width="8" height="8" rx="2.2" fill="var(--accent)"/><rect x="13" y="3" width="8" height="8" rx="2.2" fill="var(--sky)"/>'
         '<rect x="3" y="13" width="8" height="8" rx="2.2" fill="var(--accent-2)"/><rect x="13" y="13" width="8" height="8" rx="2.2" fill="var(--leaf)"/></svg>')
FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
         '<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..600&family=Hanken+Grotesk:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">')
THEME = "<script>var t=localStorage.getItem('atlas-theme');if(t)document.documentElement.setAttribute('data-theme',t);</script>"

def chapter_page(ch):
    slug = ch["slug"]; name = ch["chapter"]; subj = ch.get("subject", ""); grp = ch.get("group", "")
    blurb = ch.get("blurb", ""); subs = ch.get("subtopics", [])
    canon = f"{SITE}/chapter/{slug}/"
    desc = (blurb + " Key topics: " + ", ".join(subs[:6]) + ".")[:300]
    anchors = [a for a in ch.get("anchors", []) if not dead(a.get("url"))][:16]

    jsonld = {
        "@context": "https://schema.org", "@type": "LearningResource", "name": name,
        "description": blurb, "url": canon, "inLanguage": "en", "isAccessibleForFree": True,
        "learningResourceType": ["lecture notes", "problem set", "video", "reference"],
        "educationalLevel": "High school, Olympiad, Undergraduate",
        "about": [{"@type": "Thing", "name": s} for s in subs],
        "teaches": subs,
        "keywords": ", ".join([name, subj] + subs + ["JEE", "NEET", "SAT", "AP", "A-Level", "IB", "Olympiad", "free notes", "PDF", "video lectures"]),
        "isPartOf": {"@type": "WebSite", "name": "Problem Atlas", "url": SITE + "/"},
        "provider": {"@type": "Person", "name": "Indrajeet Yadav"},
    }
    chips = "".join(f'<span class="chip">{e(s)}</span>' for s in subs)
    cards = "".join(
        f'<article class="res"><div class="res-badges"><span class="badge src">{e(a.get("source",""))}</span>'
        f'<span class="badge">{e(a.get("type",""))}</span></div><h4>{e(a.get("title",""))}</h4>'
        f'<p>{e(a.get("note",""))}</p><div class="res-actions"><a class="res-open" href="{e(a.get("url"))}" target="_blank" rel="noopener noreferrer">Open ↗</a></div></article>'
        for a in anchors)
    return f"""<!DOCTYPE html>
<html lang="en" data-theme="dark"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{e(name)} — {e(subj)} notes, problems & video lectures | Problem Atlas</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{canon}">
<meta name="theme-color" content="#0c1311">
<meta property="og:type" content="article"><meta property="og:site_name" content="Problem Atlas">
<meta property="og:title" content="{e(name)} — free resources ({e(subj)})">
<meta property="og:description" content="{e(blurb)}">
<meta property="og:url" content="{canon}">
<meta property="og:image" content="{SITE}/og-image.jpg"><meta property="og:image:width" content="600"><meta property="og:image:height" content="315">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="{SITE}/og-image.jpg">
<script type="application/ld+json">{json.dumps(jsonld, ensure_ascii=False)}</script>
<link rel="icon" href="/problem-atlas/favicon.svg"><link rel="manifest" href="../../manifest.json"><link rel="apple-touch-icon" href="../../icon-192.png">
{FONTS}<link rel="stylesheet" href="../../styles.css">{THEME}</head>
<body><div class="grain" aria-hidden="true"></div>
<header class="nav"><a class="brand" href="../../" aria-label="Problem Atlas home">{GLYPH}<span class="brand-text"><span class="brand-name">Problem&nbsp;Atlas</span><span class="brand-sub">Maths · Physics · Chemistry · Biology</span></span></a>
<nav class="nav-links"><a href="../../">All chapters</a></nav></header>
<main class="detail wrap" style="--subj:var(--accent)">
<a class="crumb" href="../../">← All chapters</a>
<div class="detail-head"><div style="flex:1;min-width:260px"><h1>{e(name)}</h1><p class="d-blurb">{e(blurb)}</p>
<div class="sub-list">{chips}</div></div>
<div class="detail-meta"><div class="mrow"><span class="k">Subject</span><span class="v">{e(subj)}</span></div>
<div class="mrow"><span class="k">Group</span><span class="v">{e(grp)}</span></div></div></div>
<a class="btn primary" style="display:inline-flex;margin:26px 0" href="../../#/chapter/{slug}">▶ Open the full interactive chapter — 60+ live resources, filters &amp; tools</a>
<div class="section-head"><span class="kicker">Hand-picked</span><h2>Best resources for {e(name)}</h2></div>
<div class="res-grid">{cards}</div>
<p style="margin-top:30px;color:var(--ink-soft)"><a class="btn" href="../../#/chapter/{slug}">See all resources (PDFs, problems, videos, theory &amp; tools) →</a></p>
</main>
<footer class="footer"><div class="footer-base" style="border:0"><span>© Problem Atlas · Indrajeet Yadav · free for everyone</span>
<span class="footer-tag"><a href="mailto:indrajeetsirallen@gmail.com">indrajeetsirallen@gmail.com</a></span></div></footer>
</body></html>"""

# 1) per-chapter pages
for ch in data:
    d = os.path.join(ROOT, "chapter", ch["slug"])
    os.makedirs(d, exist_ok=True)
    open(os.path.join(d, "index.html"), "w", encoding="utf-8").write(chapter_page(ch))
print("chapter pages:", len(data))

# 2) sitemap.xml
urls = [f"  <url><loc>{SITE}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>"]
for ch in data:
    urls.append(f"  <url><loc>{SITE}/chapter/{ch['slug']}/</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>")
open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8").write(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "\n".join(urls) + "\n</urlset>\n")

# 3) robots.txt
open(os.path.join(ROOT, "robots.txt"), "w", encoding="utf-8").write(
    "User-agent: *\nAllow: /\n\nSitemap: " + SITE + "/sitemap.xml\n")

# 4) favicon.svg (real file, referenced by chapter pages)
open(os.path.join(ROOT, "favicon.svg"), "w", encoding="utf-8").write(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#0c1311"/>'
    '<rect x="22" y="22" width="24" height="24" rx="7" fill="#f5c451"/><rect x="54" y="22" width="24" height="24" rx="7" fill="#6fb6e6"/>'
    '<rect x="22" y="54" width="24" height="24" rx="7" fill="#5fd3b0"/><rect x="54" y="54" width="24" height="24" rx="7" fill="#7bd88f"/></svg>\n')

# 5) inject crawlable chapter index + WebSite JSON-LD into index.html
idx = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
links = "".join(f'<a href="chapter/{ch["slug"]}/">{e(ch["chapter"])} — {e(ch.get("subject",""))}</a>' for ch in data)
idx = re.sub(r"<!--SEO-LINKS-->.*?<!--/SEO-LINKS-->", "<!--SEO-LINKS-->" + links + "<!--/SEO-LINKS-->", idx, flags=re.S)
website = {"@context": "https://schema.org", "@type": "WebSite", "name": "Problem Atlas",
           "url": SITE + "/", "inLanguage": "en",
           "description": "Free one-click index to the internet's best free learning resources for Maths, Physics, Chemistry and Biology — school to Olympiad.",
           "keywords": "free study resources, JEE, NEET, SAT, AP, A-Level, IB, Olympiad, maths physics chemistry biology notes problems videos"}
jl = '<script type="application/ld+json">' + json.dumps(website, ensure_ascii=False) + '</script>'
idx = re.sub(r"<!--SEO-JSONLD-->.*?<!--/SEO-JSONLD-->", "<!--SEO-JSONLD-->" + jl + "<!--/SEO-JSONLD-->", idx, flags=re.S)
open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8").write(idx)
print("injected", len(data), "crawlable links + WebSite JSON-LD into index.html")
print("wrote sitemap.xml, robots.txt, favicon.svg")
