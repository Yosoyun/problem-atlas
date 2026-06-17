/* =========================================================================
   PROBLEM ATLAS — application engine
   - hash router (home / chapter)
   - expands durable "seeds" into live, always-working problem links
   - global + in-chapter search, faceted filters, copy-to-clipboard
   ========================================================================= */
(function () {
  "use strict";

  const DATA = (window.ATLAS_DATA || []).slice();
  const app = document.getElementById("app");

  /* ---------------- helpers ---------------- */
  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  const enc = encodeURIComponent;

  /* ---------------- durable link builders ----------------
     Every seed becomes a LIVE search on a major platform — these URLs
     cannot 404, and each surfaces dozens-to-hundreds of solved problems. */
  const SOURCE_META = {
    mse:     { name: "Math StackExchange",    type: "Problem set", note: "Hundreds of fully-worked solutions — sort by votes for the cleanest." },
    pse:     { name: "Physics StackExchange", type: "Problem set", note: "Conceptual physics Q&A with detailed expert answers." },
    cse:     { name: "Chemistry StackExchange",type: "Problem set", note: "Detailed chemistry Q&A — mechanisms, reasoning, worked steps." },
    aops:    { name: "AoPS",                  type: "Problem set", note: "Contest & Olympiad-level discussion threads with worked solutions." },
    youtube: { name: "YouTube",               type: "Video",       note: "Lectures and step-by-step video walkthroughs." },
    google:  { name: "Web",                   type: "Search",      note: "Worksheets, notes and assorted problem sets across the web." },
    pyq:     { name: "PYQ Papers",            type: "Past papers", note: "Previous-year JEE question PDFs, chapter-wise." },
  };
  function buildUrl(src, q) {
    switch (src) {
      case "mse":     return "https://math.stackexchange.com/search?q=" + enc(q);
      case "pse":     return "https://physics.stackexchange.com/search?q=" + enc(q);
      case "cse":     return "https://chemistry.stackexchange.com/search?q=" + enc(q);
      case "aops":    return "https://www.google.com/search?q=" + enc("site:artofproblemsolving.com " + q);
      case "youtube": return "https://www.youtube.com/results?search_query=" + enc(q + " JEE");
      case "google":  return "https://www.google.com/search?q=" + enc(q + " problems with solutions");
      case "pyq":     return "https://www.google.com/search?q=" + enc(q + " JEE Advanced previous year questions pdf");
      default:        return "https://www.google.com/search?q=" + enc(q);
    }
  }

  // subjects + their teaching groups (controls home tabs, ordering, accent colour)
  const SUBJECTS = [
    { key: "Mathematics", glyph: "∫", accent: "var(--accent)",   groups: ["Algebra", "Trigonometry", "Calculus", "Coordinate Geometry", "Vectors & 3D"] },
    { key: "Physics",     glyph: "↯", accent: "var(--sky)",      groups: ["General Physics", "Mechanics", "Waves & Thermal", "Electromagnetism", "Optics & Modern"] },
    { key: "Chemistry",   glyph: "⚗", accent: "var(--accent-2)", groups: ["Physical Chemistry", "Inorganic Chemistry", "Organic Chemistry"] },
  ];
  const subjectMeta = (k) => SUBJECTS.find((s) => s.key === k) || SUBJECTS[0];

  /* ---------------- the teacher's own resources + universal tools ---------------- */
  function getStudio(subject) {
    if (subject === "Mathematics") return {
      title: "Generate unlimited custom problems with AI",
      url: "https://yosoyun.github.io/math-prompt-studio/",
      source: "Maths Prompt Studio", type: "Tool", level: "Mixed",
      note: "Indrajeet's own free prompt library — paste a prompt into ChatGPT/Claude to instantly create fresh, made-to-order practice on this exact topic.",
      feature: true,
    };
    return {
      title: "Generate unlimited custom problems with AI",
      url: "https://github.com/Yosoyun/ai-prompt-library-for-teachers",
      source: "AI Prompt Library", type: "Tool", level: "Mixed",
      note: "Indrajeet's free library of 200+ classroom AI prompts — paste one into ChatGPT/Claude to instantly create fresh practice for this topic.",
      feature: true,
    };
  }
  const TEACHER_EXTRAS = {
    "limits-continuity-differentiability": [{
      title: "Limits Masterbook — 100 advanced problems", url: "https://github.com/Yosoyun/limits-masterbook",
      source: "Indrajeet's Masterbook", type: "Problem set", level: "Olympiad",
      note: "100 advanced limit problems with multiple solution methods, Python-verified — by Indrajeet himself.",
    }],
    "inverse-trigonometry": [{
      title: "Inverse-Trig Masterbook (Ranker series)", url: "https://github.com/Yosoyun/ranker-masterbooks",
      source: "Indrajeet's Masterbook", type: "Problem set", level: "Olympiad",
      note: "200+ original competitive inverse-trigonometry problems with verified solutions.",
    }],
    "permutations-combinations": [{ title: "Andreescu Library — counting & combinatorics", url: "https://github.com/Yosoyun/andreescu-library", source: "Olympiad Library", type: "Reference", level: "Olympiad", note: "A guide to Titu Andreescu's combinatorics books for the Olympiad bridge." }],
    "sequences-series": [{ title: "Andreescu Library — inequalities & series", url: "https://github.com/Yosoyun/andreescu-library", source: "Olympiad Library", type: "Reference", level: "Olympiad", note: "Curated guide to Andreescu's books on sequences, series and inequalities." }],
    "complex-numbers": [{ title: "Andreescu Library — complex numbers", url: "https://github.com/Yosoyun/andreescu-library", source: "Olympiad Library", type: "Reference", level: "Olympiad", note: "Guide to Andreescu's classic 'Complex Numbers from A to Z'." }],
  };

  const FOOTER_WORKS = [
    { name: "ALLEN Resource Hub", desc: "Every official ALLEN channel & link, in one place", url: "https://yosoyun.github.io/allen-resource-hub/" },
    { name: "Maths Prompt Studio", desc: "500+ free AI prompts for maths teachers", url: "https://yosoyun.github.io/math-prompt-studio/" },
    { name: "AI Prompt Library for Teachers", desc: "200+ ready classroom prompts", url: "https://github.com/Yosoyun/ai-prompt-library-for-teachers" },
    { name: "Limits Masterbook", desc: "100 advanced limit problems, multi-method", url: "https://github.com/Yosoyun/limits-masterbook" },
    { name: "Ranker Masterbooks", desc: "Inverse-trig & limits, 200+ problems", url: "https://github.com/Yosoyun/ranker-masterbooks" },
    { name: "Andreescu Library", desc: "Guide to Titu Andreescu's books", url: "https://github.com/Yosoyun/andreescu-library" },
    { name: "All projects on GitHub", desc: "github.com/Yosoyun", url: "https://github.com/Yosoyun" },
  ];

  /* ---------------- expand a chapter into its full resource list ---------------- */
  function expandChapter(ch) {
    const list = [];
    list.push(getStudio(ch.subject));
    (TEACHER_EXTRAS[ch.slug] || []).forEach((r) => list.push(r));
    (ch.anchors || []).forEach((a) => list.push(a));
    (ch.seeds || []).forEach((seed) => {
      (seed.sources || []).forEach((src) => {
        const m = SOURCE_META[src] || SOURCE_META.google;
        list.push({
          title: seed.label,
          url: buildUrl(src, seed.query),
          source: m.name,
          type: m.type,
          level: seed.level || "Mixed",
          note: m.note,
          query: seed.query,
        });
      });
    });
    return list;
  }

  // cache expansion + counts
  DATA.forEach((ch) => { ch._res = expandChapter(ch); ch._count = ch._res.length; });
  const TOTAL_LINKS = DATA.reduce((n, ch) => n + ch._count, 0);

  // active subject (persisted across visits)
  let activeSubject = localStorage.getItem("atlas-subject");
  const subjectsPresent = SUBJECTS.map((s) => s.key).filter((k) => DATA.some((c) => c.subject === k));
  if (!subjectsPresent.includes(activeSubject)) activeSubject = subjectsPresent[0] || "Mathematics";
  const chaptersOf = (key) => DATA.filter((c) => c.subject === key);

  /* ---------------- home ---------------- */
  function renderHome() {
    document.title = "Problem Atlas — JEE Advanced (Maths · Physics · Chemistry)";
    const total = TOTAL_LINKS ? TOTAL_LINKS.toLocaleString() : "8,000";
    const chCount = DATA.length;

    const tabsHtml = subjectsPresent.map((k) => {
      const sm = subjectMeta(k);
      return `<button class="subj-tab" data-subject="${esc(k)}" type="button"><span class="subj-glyph" aria-hidden="true">${sm.glyph}</span><span>${esc(k)}</span><span class="subj-n">${chaptersOf(k).length}</span></button>`;
    }).join("");

    app.innerHTML = `
      <section class="hero wrap">
        <span class="eyebrow">● Free · live · always-working links</span>
        <h1>The world's best JEE Advanced problems, <em>mapped chapter&nbsp;by&nbsp;chapter.</em></h1>
        <p class="lede">A curated atlas of brilliant, strictly in-syllabus problems across <strong>Maths, Physics&nbsp;&amp; Chemistry</strong> for <strong>JEE&nbsp;Advanced</strong> — pulling the best of the Stack&nbsp;Exchanges, AoPS, MIT&nbsp;OCW, Feynman&nbsp;Lectures, LibreTexts, NCERT, Brilliant and past papers into one place. Around <strong>100 resources per chapter</strong>, every link guaranteed live.</p>
        <div class="hero-search">
          <span class="s-ico" aria-hidden="true">⌕</span>
          <input id="homeSearch" type="search" placeholder="Search chapters — e.g. limits, rotation, electrochemistry…" aria-label="Search chapters" autocomplete="off" />
          <span class="s-hint">press /</span>
        </div>
        <div class="hero-stats">
          <div class="stat"><span class="num">${chCount}</span><span class="lbl">Chapters</span></div>
          <div class="stat"><span class="num">${total}<span class="unit">+</span></span><span class="lbl">Curated links</span></div>
          <div class="stat"><span class="num">100<span class="unit">%</span></span><span class="lbl">Live, no rot</span></div>
          <div class="stat"><span class="num">0<span class="unit">₹</span></span><span class="lbl">Forever free</span></div>
        </div>
      </section>

      <section class="guide wrap" id="guide">
        <div class="section-head">
          <span class="kicker">Start here</span>
          <h2>How to use this — in 30 seconds</h2>
          <p class="sub">No account, no install. Built for teachers who just want great questions, fast.</p>
        </div>
        <div class="guide-grid">
          <div class="step"><span class="n">STEP 01</span><h3>Pick a chapter</h3><p>Tap any chapter card below. Use the search box if you know what you want.</p></div>
          <div class="step"><span class="n">STEP 02</span><h3>Filter by level</h3><p>Inside a chapter, filter to <em>JEE Main</em>, <em>JEE Advanced</em>, or <em>Olympiad</em> difficulty — and by source.</p></div>
          <div class="step"><span class="n">STEP 03</span><h3>Open or copy</h3><p>Hit <strong>Open</strong> to view live problems with solutions, or <strong>⧉</strong> to copy a link straight into your worksheet or WhatsApp.</p></div>
          <div class="step"><span class="n">STEP 04</span><h3>Need more?</h3><p>Each chapter links to an <strong>AI prompt library</strong> — generate unlimited fresh, made-to-order problems in one click.</p></div>
        </div>
        <div class="callout">
          <span class="c-ico" aria-hidden="true">✦</span>
          <p><strong>Why these links never break:</strong> instead of fragile single-problem pages (which is why old Brilliant lists died), every entry is a live topic search or an official archive. One link = an endless, always-fresh stream of in-syllabus problems with full solutions.</p>
        </div>
      </section>

      <section class="chapters wrap">
        <div class="section-head">
          <span class="kicker">The Atlas</span>
          <h2>Every JEE Advanced chapter</h2>
          <p class="sub" id="chapterCountSub"></p>
        </div>
        <div class="subj-tabs" role="tablist" aria-label="Choose subject">${tabsHtml}</div>
        <div id="chapterGroups"></div>
      </section>
    `;

    const search = document.getElementById("homeSearch");
    if (search) search.addEventListener("input", () => applyHomeSearch(search.value));
    app.querySelectorAll(".subj-tab").forEach((t) => t.addEventListener("click", () => switchSubject(t.dataset.subject)));
    renderSubject(activeSubject);
    window.scrollTo(0, 0);
  }

  function switchSubject(key) {
    activeSubject = key;
    localStorage.setItem("atlas-subject", key);
    renderSubject(key);
  }

  function renderSubject(key) {
    const sm = subjectMeta(key);
    const chapters = chaptersOf(key);
    const groups = {};
    chapters.forEach((ch) => { (groups[ch.group] = groups[ch.group] || []).push(ch); });
    const ordered = [
      ...sm.groups.filter((g) => groups[g]),
      ...Object.keys(groups).filter((g) => !sm.groups.includes(g)),
    ];

    let n = 0;
    const html = ordered.map((g) => {
      const cards = groups[g].map((ch) => {
        n += 1;
        const delay = Math.min(n * 0.022, 0.45);
        const chips = (ch.subtopics || []).slice(0, 3).map((s) => `<span class="chip">${esc(s)}</span>`).join("");
        return `
          <article class="ch-card" data-slug="${esc(ch.slug)}" data-search="${esc((ch.chapter + " " + ch.group + " " + (ch.subtopics || []).join(" ") + " " + (ch.blurb || "")).toLowerCase())}" style="animation-delay:${delay}s" tabindex="0" role="link" aria-label="Open ${esc(ch.chapter)}">
            <div class="ch-top">
              <span class="ch-num">${String(n).padStart(2, "0")}</span>
              <span class="ch-go" aria-hidden="true">→</span>
            </div>
            <h3>${esc(ch.chapter)}</h3>
            <p class="ch-blurb">${esc(ch.blurb || "")}</p>
            <div class="ch-foot">
              <span class="ch-count"><b>${ch._count}</b> resources</span>
              <span class="weight ${esc(ch.jeeWeight || "")}">${esc(ch.jeeWeight || "")} weight</span>
            </div>
            <div class="chips" style="margin-top:12px">${chips}</div>
          </article>`;
      }).join("");
      return `
        <section class="group" data-group="${esc(g)}">
          <div class="group-head">
            <span class="g-name">${esc(g)}</span>
            <span class="g-count">${groups[g].length} chapters</span>
            <span class="g-line"></span>
          </div>
          <div class="card-grid">${cards}</div>
        </section>`;
    }).join("");

    const container = document.getElementById("chapterGroups");
    container.style.setProperty("--subj", sm.accent);
    container.innerHTML = html || emptyState("Resources are loading…");

    const tabsWrap = app.querySelector(".subj-tabs");
    if (tabsWrap) tabsWrap.style.setProperty("--subj", sm.accent);
    app.querySelectorAll(".subj-tab").forEach((t) => t.classList.toggle("active", t.dataset.subject === key));
    const sub = document.getElementById("chapterCountSub");
    if (sub) sub.textContent = `${chapters.length} ${key} chapters · grouped the way you teach them.`;

    bindCardNav();
    const search = document.getElementById("homeSearch");
    if (search && search.value.trim()) applyHomeSearch(search.value);
  }

  function applyHomeSearch(q) {
    const term = q.trim().toLowerCase();
    document.querySelectorAll(".ch-card").forEach((c) => {
      c.style.display = !term || c.dataset.search.includes(term) ? "" : "none";
    });
    document.querySelectorAll(".group").forEach((g) => {
      const any = [...g.querySelectorAll(".ch-card")].some((c) => c.style.display !== "none");
      g.style.display = any ? "" : "none";
    });
  }

  function bindCardNav() {
    document.querySelectorAll(".ch-card").forEach((c) => {
      const go = () => { location.hash = "#/chapter/" + c.dataset.slug; };
      c.addEventListener("click", go);
      c.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
    });
  }

  /* ---------- chapter detail ---------- */
  let detailState = null;

  function renderChapter(slug) {
    const ch = DATA.find((c) => c.slug === slug);
    if (!ch) { renderHome(); return; }
    document.title = ch.chapter + " — Problem Atlas";
    activeSubject = ch.subject || activeSubject;
    if (subjectsPresent.includes(activeSubject)) localStorage.setItem("atlas-subject", activeSubject);
    const subjCh = chaptersOf(ch.subject);
    const idx = (subjCh.indexOf(ch) + 1) || (DATA.indexOf(ch) + 1);
    const subjAccent = subjectMeta(ch.subject).accent;

    const res = ch._res;
    const facets = { source: count(res, "source"), type: count(res, "type"), level: count(res, "level") };
    detailState = { ch, res, active: { source: new Set(), type: new Set(), level: new Set() }, term: "" };

    const subs = (ch.subtopics || []).map((s) => `<span class="chip">${esc(s)}</span>`).join("");

    app.innerHTML = `
      <section class="detail wrap" style="--subj:${subjAccent}">
        <a class="crumb" href="#/">← All chapters</a>
        <div class="detail-head">
          <span class="d-index">${String(idx).padStart(2, "0")}</span>
          <div style="flex:1; min-width:260px">
            <h1>${esc(ch.chapter)}</h1>
            <p class="d-blurb">${esc(ch.blurb || "")}</p>
            <div class="sub-list">${subs}</div>
          </div>
          <div class="detail-meta">
            <div class="mrow"><span class="k">Subject</span><span class="v">${esc(ch.subject || "—")}</span></div>
            <div class="mrow"><span class="k">Group</span><span class="v">${esc(ch.group)}</span></div>
            <div class="mrow"><span class="k">JEE weight</span><span class="v">${esc(ch.jeeWeight || "—")}</span></div>
            <div class="mrow"><span class="k">Resources</span><span class="v">${res.length}</span></div>
          </div>
        </div>

        <div class="toolbar">
          <div class="toolbar-row">
            <div class="filter-search">
              <span class="s-ico" aria-hidden="true">⌕</span>
              <input id="detailSearch" type="search" placeholder="Filter within this chapter…" aria-label="Filter resources" autocomplete="off" />
            </div>
            <button class="btn" id="copyAll" type="button">⧉ Copy all visible links</button>
            <button class="btn" id="clearFilters" type="button">Reset</button>
          </div>
          <div class="facets">
            ${facetRow("Level", "level", facets.level)}
            ${facetRow("Source", "source", facets.source)}
            ${facetRow("Type", "type", facets.type)}
          </div>
        </div>

        <div class="result-meta">
          <span id="resultCount"><b>${res.length}</b> resources</span>
          <span>Tip: filter to <b>JEE Advanced</b> or <b>Olympiad</b> for harder sets.</span>
        </div>
        <div class="res-grid" id="resGrid"></div>
      </section>
    `;

    document.getElementById("detailSearch").addEventListener("input", (e) => { detailState.term = e.target.value.trim().toLowerCase(); applyDetailFilters(); });
    document.getElementById("copyAll").addEventListener("click", copyAllVisible);
    document.getElementById("clearFilters").addEventListener("click", clearFilters);
    app.querySelectorAll(".pill").forEach((p) => p.addEventListener("click", () => togglePill(p)));
    applyDetailFilters();
    window.scrollTo(0, 0);
  }

  function count(arr, key) {
    const m = new Map();
    arr.forEach((r) => m.set(r[key], (m.get(r[key]) || 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }
  function facetRow(label, key, entries) {
    const pills = entries.map(([val, c]) =>
      `<button class="pill" data-key="${esc(key)}" data-val="${esc(val)}">${esc(val)}<span class="pc">${c}</span></button>`
    ).join("");
    return `<div class="facet-row"><span class="f-label">${esc(label)}</span>${pills}</div>`;
  }
  function togglePill(p) {
    const set = detailState.active[p.dataset.key];
    const v = p.dataset.val;
    if (set.has(v)) { set.delete(v); p.classList.remove("active"); }
    else { set.add(v); p.classList.add("active"); }
    applyDetailFilters();
  }
  function clearFilters() {
    detailState.term = "";
    Object.values(detailState.active).forEach((s) => s.clear());
    app.querySelectorAll(".pill.active").forEach((p) => p.classList.remove("active"));
    const ds = document.getElementById("detailSearch"); if (ds) ds.value = "";
    applyDetailFilters();
  }

  function applyDetailFilters() {
    const { res, active, term } = detailState;
    const a = active;
    const filtered = res.filter((r) => {
      if (a.source.size && !a.source.has(r.source)) return false;
      if (a.type.size && !a.type.has(r.type)) return false;
      if (a.level.size && !a.level.has(r.level)) return false;
      if (term) {
        const hay = (r.title + " " + r.note + " " + r.source + " " + r.type + " " + (r.query || "")).toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });

    const grid = document.getElementById("resGrid");
    document.getElementById("resultCount").innerHTML = `<b>${filtered.length}</b> of ${res.length} resources`;

    if (!filtered.length) { grid.innerHTML = emptyState("No matches — try clearing a filter."); return; }

    grid.innerHTML = filtered.map((r, i) => {
      const delay = Math.min(i * 0.012, 0.4);
      const lvlClass = "lvl " + String(r.level || "Mixed").replace(/\s+/g, "-");
      const feat = r.feature ? " feature" : "";
      if (r.feature) {
        return `
          <article class="feature" style="animation-delay:${delay}s">
            <span class="f-ico" aria-hidden="true">∑</span>
            <div style="flex:1">
              <h4>${esc(r.title)}</h4>
              <p>${esc(r.note)}</p>
            </div>
            <a class="btn primary" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">Open Studio ↗</a>
          </article>`;
      }
      return `
        <article class="res${feat}" style="animation-delay:${delay}s">
          <div class="res-badges">
            <span class="badge src">${esc(r.source)}</span>
            <span class="badge">${esc(r.type)}</span>
            <span class="${lvlClass}">${esc(r.level || "Mixed")}</span>
          </div>
          <h4>${esc(r.title)}</h4>
          <p>${esc(r.note)}</p>
          <div class="res-actions">
            <a class="res-open" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">Open ↗</a>
            <button class="res-copy" type="button" title="Copy link" data-url="${esc(r.url)}" aria-label="Copy link">⧉</button>
          </div>
        </article>`;
    }).join("");

    grid.querySelectorAll(".res-copy").forEach((b) =>
      b.addEventListener("click", () => copyText(b.dataset.url, "Link copied"))
    );
  }

  function copyAllVisible() {
    const { res, active, term } = detailState;
    const a = active;
    const list = res.filter((r) => {
      if (a.source.size && !a.source.has(r.source)) return false;
      if (a.type.size && !a.type.has(r.type)) return false;
      if (a.level.size && !a.level.has(r.level)) return false;
      if (term) { const hay = (r.title + " " + r.note + " " + r.source).toLowerCase(); if (!hay.includes(term)) return false; }
      return true;
    });
    const text = list.map((r) => `${r.title} (${r.source}) — ${r.url}`).join("\n");
    copyText(text, `Copied ${list.length} links`);
  }

  function emptyState(msg) {
    return `<div class="empty"><div class="e-ico">∅</div><p>${esc(msg)}</p></div>`;
  }

  /* ---------------- clipboard + toast ---------------- */
  let toastTimer;
  function toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 1900);
  }
  function copyText(text, okMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => toast(okMsg)).catch(() => fallbackCopy(text, okMsg));
    } else fallbackCopy(text, okMsg);
  }
  function fallbackCopy(text, okMsg) {
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); toast(okMsg); } catch (e) { toast("Press Ctrl/Cmd+C to copy"); }
    document.body.removeChild(ta);
  }

  /* ---------------- theme ---------------- */
  function initTheme() {
    const saved = localStorage.getItem("atlas-theme");
    if (saved) document.documentElement.setAttribute("data-theme", saved);
    document.getElementById("themeToggle").addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
      const next = cur === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("atlas-theme", next);
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", next === "light" ? "#f4efe2" : "#0c1311");
    });
  }

  /* ---------------- nav + router ---------------- */
  function initNav() {
    document.querySelectorAll(".nav-links a[data-nav]").forEach((a) => {
      const kind = a.dataset.nav;
      if (kind === "feedback") return; // mailto
      a.addEventListener("click", (e) => {
        if (kind === "home") { e.preventDefault(); location.hash = "#/"; }
        else if (kind === "guide") {
          e.preventDefault();
          const goScroll = () => { const el = document.getElementById("guide"); if (el) el.scrollIntoView({ behavior: "smooth" }); };
          if (location.hash.startsWith("#/chapter")) { location.hash = "#/"; setTimeout(goScroll, 60); } else goScroll();
        } else if (kind === "about") {
          e.preventDefault();
          document.getElementById("about").scrollIntoView({ behavior: "smooth" });
        }
      });
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "/" && !/input|textarea|select/i.test(document.activeElement.tagName)) {
        const s = document.getElementById("homeSearch") || document.getElementById("detailSearch");
        if (s) { e.preventDefault(); s.focus(); }
      }
    });
  }

  function route() {
    const h = location.hash || "#/";
    const m = h.match(/^#\/chapter\/(.+)$/);
    if (m) renderChapter(decodeURIComponent(m[1]));
    else renderHome();
  }

  function renderFooter() {
    const works = document.getElementById("footerWorks");
    if (works) works.innerHTML = FOOTER_WORKS.map((w) =>
      `<li><a href="${esc(w.url)}" target="_blank" rel="noopener noreferrer"><span class="w-name">${esc(w.name)} ↗</span><span class="w-desc">${esc(w.desc)}</span></a></li>`
    ).join("");
    const yr = document.getElementById("year"); if (yr) yr.textContent = new Date().getFullYear();
  }

  /* ---------------- boot ---------------- */
  initTheme();
  initNav();
  renderFooter();
  window.addEventListener("hashchange", route);
  route();
})();
