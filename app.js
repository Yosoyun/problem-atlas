/* =========================================================================
   PROBLEM ATLAS — application engine (JEE · NEET · Olympiad · Foundation)
   - hash router (home / chapter)
   - expands durable "seeds" into live, always-working searches
   - per-chapter multi-exam + PDF + Reddit + tool shortcuts
   - multilayered chapter view: resources grouped into clear sections
   ========================================================================= */
(function () {
  "use strict";

  const DATA = (window.ATLAS_DATA || []).slice();
  const app = document.getElementById("app");

  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  const enc = (s) => encodeURIComponent(s);
  const qp = (s) => encodeURIComponent(s).replace(/%20/g, "+"); // '+' = native search-engine spacing

  /* ---------------- subjects ---------------- */
  const SUBJECTS = [
    { key: "Mathematics", glyph: "∫", accent: "var(--accent)",   groups: ["Algebra", "Trigonometry", "Calculus", "Coordinate Geometry", "Vectors & 3D"] },
    { key: "Physics",     glyph: "↯", accent: "var(--sky)",      groups: ["General Physics", "Mechanics", "Waves & Thermal", "Electromagnetism", "Optics & Modern"] },
    { key: "Chemistry",   glyph: "⚗", accent: "var(--accent-2)", groups: ["Physical Chemistry", "Inorganic Chemistry", "Organic Chemistry"] },
    { key: "Biology",     glyph: "❀", accent: "var(--leaf)",     groups: ["Diversity & Cell Biology", "Plant Physiology & Anatomy", "Human Physiology", "Reproduction", "Genetics & Evolution", "Biology in Human Welfare & Biotech", "Ecology"] },
  ];
  const subjectMeta = (k) => SUBJECTS.find((s) => s.key === k) || SUBJECTS[0];
  const examTag = (subj) => (subj === "Biology" ? "NEET" : "JEE");

  /* ---------------- durable link builders ---------------- */
  const SOURCE_META = {
    mse:     { name: "Math StackExchange",     type: "Problem set", note: "Hundreds of fully-worked solutions — sort by votes for the cleanest." },
    pse:     { name: "Physics StackExchange",  type: "Problem set", note: "Conceptual physics Q&A with detailed expert answers." },
    cse:     { name: "Chemistry StackExchange",type: "Problem set", note: "Detailed chemistry Q&A — mechanisms, reasoning, worked steps." },
    bio:     { name: "Biology StackExchange",  type: "Problem set", note: "Biology Q&A with expert explanations." },
    aops:    { name: "AoPS",                   type: "Problem set", note: "Contest & Olympiad-level threads with worked solutions." },
    youtube: { name: "YouTube",                type: "Video",       note: "Lectures and step-by-step video walkthroughs." },
    google:  { name: "Web",                    type: "Search",      note: "Worksheets, notes and assorted problem sets across the web." },
    pyq:     { name: "PYQ Papers",             type: "Past papers", note: "Previous-year question PDFs, chapter-wise." },
  };
  function buildUrl(src, q, subject) {
    const t = examTag(subject);
    switch (src) {
      case "mse":     return "https://math.stackexchange.com/search?q=" + qp(q);
      case "pse":     return "https://physics.stackexchange.com/search?q=" + qp(q);
      case "cse":     return "https://chemistry.stackexchange.com/search?q=" + qp(q);
      case "bio":     return "https://biology.stackexchange.com/search?q=" + qp(q);
      case "aops":    return "https://www.google.com/search?q=" + qp("site:artofproblemsolving.com " + q);
      case "youtube": return "https://www.youtube.com/results?search_query=" + qp(q + " " + t);
      case "google":  return "https://www.google.com/search?q=" + qp(q + " questions with solutions");
      case "pyq":     return "https://www.google.com/search?q=" + qp(q + " " + t + " previous year questions");
      case "reddit":  return "https://www.reddit.com/search/?q=" + qp(q);
      case "wolfram": return "https://www.wolframalpha.com/input?i=" + enc(q);
      case "gpdf":    return "https://www.google.com/search?q=" + qp(q + " filetype:pdf");
      case "graw":    return "https://www.google.com/search?q=" + qp(q);
      default:        return "https://www.google.com/search?q=" + qp(q);
    }
  }

  /* ---------------- resource categories (the "layers") ---------------- */
  const CATS = [
    { key: "Past Papers & PDFs",    icon: "📄", blurb: "Official archives, exam-wise previous-year papers and downloadable PDFs." },
    { key: "Problems & Solutions",  icon: "✏️", blurb: "Worked problems from Stack Exchange, AoPS, Brilliant and the web." },
    { key: "Video Lectures",        icon: "🎥", blurb: "YouTube lectures and step-by-step walkthroughs." },
    { key: "Theory & Notes",        icon: "📚", blurb: "Concept notes, references and free textbooks (NCERT, LibreTexts, MIT…)." },
    { key: "Community",             icon: "💬", blurb: "Reddit threads where students discuss this exact topic." },
    { key: "Tools",                 icon: "🧮", blurb: "Calculators, graphing and interactive simulations." },
  ];
  function categorize(r) {
    if (r.cat) return r.cat;
    const s = r.source || "", t = r.type || "";
    if (s === "YouTube") return "Video Lectures";
    if (/Reddit/i.test(s)) return "Community";
    if (t === "Tool" || /Wolfram Alpha|Desmos|GeoGebra|PhET/i.test(s)) return "Tools";
    if (t === "Past papers") return "Past Papers & PDFs";
    if (t === "Problem set" || /StackExchange|AoPS|Brilliant/i.test(s)) return "Problems & Solutions";
    if (t === "Search") return "Problems & Solutions";
    return "Theory & Notes";
  }
  const LEVEL_ORDER = ["Foundation", "JEE Main", "NEET", "JEE Advanced", "Olympiad", "Mixed"];

  /* ---------------- AI studio + teacher resources ---------------- */
  function getStudio(subject) {
    if (subject === "Mathematics") return {
      title: "Generate unlimited custom problems with AI", url: "https://yosoyun.github.io/math-prompt-studio/",
      source: "Maths Prompt Studio", type: "Tool", level: "Mixed", feature: true,
      note: "Indrajeet's own free prompt library — paste a prompt into ChatGPT/Claude to instantly create fresh practice on this exact topic.",
    };
    return {
      title: "Generate unlimited custom problems with AI", url: "https://github.com/Yosoyun/ai-prompt-library-for-teachers",
      source: "AI Prompt Library", type: "Tool", level: "Mixed", feature: true,
      note: "Indrajeet's free library of 200+ classroom AI prompts — paste one into ChatGPT/Claude to instantly create fresh practice for this topic.",
    };
  }
  const TEACHER_EXTRAS = {
    "limits-continuity-differentiability": [{ title: "Limits Masterbook — 100 advanced problems", url: "https://github.com/Yosoyun/limits-masterbook", source: "Indrajeet's Masterbook", type: "Problem set", level: "Olympiad", note: "100 advanced limit problems with multiple methods, Python-verified — by Indrajeet himself." }],
    "inverse-trigonometry": [{ title: "Inverse-Trig Masterbook (Ranker series)", url: "https://github.com/Yosoyun/ranker-masterbooks", source: "Indrajeet's Masterbook", type: "Problem set", level: "Olympiad", note: "200+ original competitive inverse-trigonometry problems with verified solutions." }],
    "permutations-combinations": [{ title: "Andreescu Library — counting & combinatorics", url: "https://github.com/Yosoyun/andreescu-library", source: "Olympiad Library", type: "Reference", level: "Olympiad", note: "A guide to Titu Andreescu's combinatorics books for the Olympiad bridge." }],
    "sequences-series": [{ title: "Andreescu Library — inequalities & series", url: "https://github.com/Yosoyun/andreescu-library", source: "Olympiad Library", type: "Reference", level: "Olympiad", note: "Curated guide to Andreescu's books on sequences, series and inequalities." }],
    "complex-numbers": [{ title: "Andreescu Library — complex numbers", url: "https://github.com/Yosoyun/andreescu-library", source: "Olympiad Library", type: "Reference", level: "Olympiad", note: "Guide to Andreescu's classic 'Complex Numbers from A to Z'." }],
  };
  const FOOTER_WORKS = [
    { name: "Maths Prompt Studio", desc: "500+ free AI prompts for maths teachers", url: "https://yosoyun.github.io/math-prompt-studio/" },
    { name: "AI Prompt Library for Teachers", desc: "200+ ready classroom prompts", url: "https://github.com/Yosoyun/ai-prompt-library-for-teachers" },
    { name: "Limits Masterbook", desc: "100 advanced limit problems, multi-method", url: "https://github.com/Yosoyun/limits-masterbook" },
    { name: "Ranker Masterbooks", desc: "Inverse-trig & limits, 200+ problems", url: "https://github.com/Yosoyun/ranker-masterbooks" },
    { name: "Andreescu Library", desc: "Guide to Titu Andreescu's books", url: "https://github.com/Yosoyun/andreescu-library" },
    { name: "All projects on GitHub", desc: "github.com/Yosoyun", url: "https://github.com/Yosoyun" },
  ];

  /* ---------------- per-chapter generated shortcuts ---------------- */
  function subjectExams(subject) {
    if (subject === "Mathematics") return ["Foundation", "JEE Main", "JEE Advanced", "Olympiad"];
    if (subject === "Physics" || subject === "Chemistry") return ["Foundation", "JEE Main", "NEET", "JEE Advanced", "Olympiad"];
    if (subject === "Biology") return ["Foundation", "NEET", "Olympiad"];
    return ["JEE Main", "JEE Advanced"];
  }
  const SUBREDDITS = {
    Mathematics: ["JEENEETards", "learnmath"],
    Physics: ["JEENEETards", "PhysicsStudents"],
    Chemistry: ["JEENEETards", "chemhelp"],
    Biology: ["NEET", "JEENEETards"],
  };
  const SUBJ_WORD = { Mathematics: "maths", Physics: "physics", Chemistry: "chemistry", Biology: "biology" };
  // clean, searchable topic key — drop "(parentheticals)" and "&" that wreck Google relevance
  function topicKey(ch) {
    return ch.chapter.replace(/\([^)]*\)/g, " ").replace(/&/g, " and ").replace(/\s+/g, " ").trim();
  }
  function chapterShortcuts(ch) {
    const name = ch.chapter, subj = ch.subject, key = topicKey(ch), sw = SUBJ_WORD[subj] || "", ex = examTag(subj), out = [];
    const examLabel = { Foundation: "Foundation (Class 9–10)", "JEE Main": "JEE Main", NEET: "NEET", "JEE Advanced": "JEE Advanced", Olympiad: "Olympiad" };
    subjectExams(subj).forEach((e) => {
      let q, note, cat;
      if (e === "Foundation") { q = key + " " + sw + " class 9 10 foundation questions"; note = "Foundation-level basics & NTSE/KVPY-style questions."; cat = "Past Papers & PDFs"; }
      else if (e === "Olympiad") { q = key + " " + sw + " olympiad problems with solutions"; note = "Olympiad-level problems on this topic."; cat = "Problems & Solutions"; }
      else { q = key + " " + e + " " + sw + " previous year questions with solutions"; note = e + " previous-year questions on this chapter."; cat = "Past Papers & PDFs"; }
      out.push({ title: name + " — " + examLabel[e] + " questions", url: buildUrl("graw", q, subj), source: "Google", type: e === "Olympiad" ? "Problem set" : "Search", level: e, note, cat });
    });
    const isBio = subj === "Biology";
    const pdfs = [
      { q: key + " " + sw + " NCERT chapter filetype:pdf", t: name + " — NCERT chapter (PDF)", n: "Official NCERT chapter PDF — the syllabus baseline." },
      { q: key + " " + sw + " notes pdf (site:ncert.nic.in OR site:byjus.com OR site:vedantu.com OR site:selfstudys.com OR site:learncbse.in)", t: name + " — notes from trusted sites (PDF)", n: "PDF notes from NCERT, BYJU'S, Vedantu & other known sources." },
      { q: key + " " + sw + (isBio ? " labelled diagrams pdf" : " formula sheet short notes pdf"), t: name + " — " + (isBio ? "labelled diagrams" : "formula sheet") + " (PDF)", n: (isBio ? "Clear labelled diagrams" : "Formula / short-revision sheet") + " as PDF." },
      { q: key + " " + ex + " chapter wise previous year questions pdf", t: name + " — chapter-wise PYQ (PDF)", n: "Previous-year question compilations for this chapter (PDF)." },
      { q: key + " " + sw + " daily practice problems dpp pdf with solutions", t: name + " — DPP / practice sheet (PDF)", n: "Daily-practice-problem (DPP) sheets with answers (PDF)." },
    ];
    pdfs.forEach((p) => out.push({ title: p.t, url: buildUrl("graw", p.q, subj), source: "PDF Search", type: "Past papers", level: "Mixed", note: p.n, cat: "Past Papers & PDFs" }));
    (SUBREDDITS[subj] || ["JEENEETards"]).forEach((sr) => {
      out.push({ title: name + " — r/" + sr, url: "https://www.reddit.com/r/" + sr + "/search/?q=" + qp(key) + "&restrict_sr=1&sort=relevance", source: "Reddit", type: "Reference", level: "Mixed", note: "Student discussions, doubts and tips on r/" + sr + ".", cat: "Community" });
    });
    out.push({ title: name + " — Reddit (all)", url: buildUrl("reddit", key, subj), source: "Reddit", type: "Reference", level: "Mixed", note: "Every Reddit thread mentioning this topic.", cat: "Community" });
    if (!isBio) out.push({ title: name + " — Wolfram Alpha", url: buildUrl("wolfram", key, subj), source: "Wolfram Alpha", type: "Tool", level: "Mixed", note: "Compute, plot and verify problems instantly.", cat: "Tools" });
    return out;
  }

  /* ---------------- expand a chapter into its full resource list ---------------- */
  function expandChapter(ch) {
    const list = [];
    list.push(getStudio(ch.subject));
    (TEACHER_EXTRAS[ch.slug] || []).forEach((r) => list.push({ ...r, cat: categorize(r) }));
    chapterShortcuts(ch).forEach((r) => list.push(r));
    (ch.anchors || []).forEach((a) => list.push({ ...a, cat: categorize(a) }));
    (ch.seeds || []).forEach((seed) => {
      (seed.sources || []).forEach((src) => {
        const m = SOURCE_META[src] || SOURCE_META.google;
        const r = { title: seed.label, url: buildUrl(src, seed.query, ch.subject), source: m.name, type: m.type, level: seed.level || "Mixed", note: m.note, query: seed.query };
        r.cat = categorize(r);
        list.push(r);
      });
    });
    return list;
  }

  DATA.forEach((ch) => { ch._res = expandChapter(ch); ch._count = ch._res.length; });
  const TOTAL_LINKS = DATA.reduce((n, ch) => n + ch._count, 0);

  let activeSubject = localStorage.getItem("atlas-subject");
  const subjectsPresent = SUBJECTS.map((s) => s.key).filter((k) => DATA.some((c) => c.subject === k));
  if (!subjectsPresent.includes(activeSubject)) activeSubject = subjectsPresent[0] || "Mathematics";
  const chaptersOf = (key) => DATA.filter((c) => c.subject === key);

  /* ---------------- home ---------------- */
  function renderHome() {
    document.title = "Problem Atlas — JEE · NEET · Olympiad · Foundation";
    const total = TOTAL_LINKS ? TOTAL_LINKS.toLocaleString() : "11,000";
    const chCount = DATA.length;

    const tabsHtml = subjectsPresent.map((k) => {
      const sm = subjectMeta(k);
      return `<button class="subj-tab" data-subject="${esc(k)}" type="button"><span class="subj-glyph" aria-hidden="true">${sm.glyph}</span><span>${esc(k)}</span><span class="subj-n">${chaptersOf(k).length}</span></button>`;
    }).join("");

    app.innerHTML = `
      <section class="hero wrap">
        <span class="eyebrow">● Free · live · always-working links</span>
        <h1>The world's best problems for <em>JEE, NEET &amp; Olympiad</em> — mapped chapter by chapter.</h1>
        <p class="lede">A curated atlas of brilliant, strictly in-syllabus problems across <strong>Maths, Physics, Chemistry &amp; Biology</strong> — for <strong>JEE&nbsp;(Main&nbsp;&amp;&nbsp;Advanced), NEET, Olympiads</strong> and <strong>Foundation</strong>. Pulling the best of the Stack&nbsp;Exchanges, AoPS, Reddit, Wolfram, MIT&nbsp;OCW, NCERT, Feynman, LibreTexts, Brilliant and past-paper PDFs into one place — around <strong>100+ resources per chapter</strong>, every link guaranteed live.</p>
        <div class="hero-search">
          <span class="s-ico" aria-hidden="true">⌕</span>
          <input id="homeSearch" type="search" placeholder="Search chapters — e.g. limits, rotation, genetics, electrochemistry…" aria-label="Search chapters" autocomplete="off" />
          <span class="s-hint">press /</span>
        </div>
        <div class="hero-stats">
          <div class="stat"><span class="num">${chCount}</span><span class="lbl">Chapters</span></div>
          <div class="stat"><span class="num">${total}<span class="unit">+</span></span><span class="lbl">Curated links</span></div>
          <div class="stat"><span class="num">5</span><span class="lbl">Exams covered</span></div>
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
          <div class="step"><span class="n">STEP 01</span><h3>Pick subject &amp; chapter</h3><p>Choose Maths / Physics / Chemistry / Biology, then tap a chapter — or just search.</p></div>
          <div class="step"><span class="n">STEP 02</span><h3>Filter by exam</h3><p>Inside a chapter, filter to <em>Foundation</em>, <em>JEE&nbsp;Main</em>, <em>NEET</em>, <em>JEE&nbsp;Advanced</em> or <em>Olympiad</em>.</p></div>
          <div class="step"><span class="n">STEP 03</span><h3>Jump to a layer</h3><p>Each chapter is split into sections — <strong>PDFs</strong>, <strong>Problems</strong>, <strong>Videos</strong>, <strong>Theory</strong>, <strong>Community</strong>, <strong>Tools</strong>. Open or <strong>⧉</strong> copy any link.</p></div>
          <div class="step"><span class="n">STEP 04</span><h3>Need more?</h3><p>Every chapter links to an <strong>AI prompt library</strong> — generate unlimited fresh, made-to-order problems in one click.</p></div>
        </div>
        <div class="callout">
          <span class="c-ico" aria-hidden="true">✦</span>
          <p><strong>Why these links never break:</strong> instead of fragile single-problem pages (which is why old Brilliant lists died), every entry is a live topic search or an official archive. One link = an endless, always-fresh stream of in-syllabus problems with full solutions.</p>
        </div>
      </section>

      <section class="chapters wrap">
        <div class="section-head">
          <span class="kicker">The Atlas</span>
          <h2>Every chapter, every exam</h2>
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
    const ordered = [...sm.groups.filter((g) => groups[g]), ...Object.keys(groups).filter((g) => !sm.groups.includes(g))];

    let n = 0;
    const html = ordered.map((g) => {
      const cards = groups[g].map((ch) => {
        n += 1;
        const delay = Math.min(n * 0.02, 0.45);
        const chips = (ch.subtopics || []).slice(0, 3).map((s) => `<span class="chip">${esc(s)}</span>`).join("");
        return `
          <article class="ch-card" data-slug="${esc(ch.slug)}" data-search="${esc((ch.chapter + " " + ch.group + " " + (ch.subtopics || []).join(" ") + " " + (ch.blurb || "")).toLowerCase())}" style="animation-delay:${delay}s" tabindex="0" role="link" aria-label="Open ${esc(ch.chapter)}">
            <div class="ch-top"><span class="ch-num">${String(n).padStart(2, "0")}</span><span class="ch-go" aria-hidden="true">→</span></div>
            <h3>${esc(ch.chapter)}</h3>
            <p class="ch-blurb">${esc(ch.blurb || "")}</p>
            <div class="ch-foot"><span class="ch-count"><b>${ch._count}</b> resources</span><span class="weight ${esc(ch.jeeWeight || "")}">${esc(ch.jeeWeight || "")} weight</span></div>
            <div class="chips" style="margin-top:12px">${chips}</div>
          </article>`;
      }).join("");
      return `<section class="group" data-group="${esc(g)}"><div class="group-head"><span class="g-name">${esc(g)}</span><span class="g-count">${groups[g].length} chapters</span><span class="g-line"></span></div><div class="card-grid">${cards}</div></section>`;
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
    document.querySelectorAll(".ch-card").forEach((c) => { c.style.display = !term || c.dataset.search.includes(term) ? "" : "none"; });
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

  /* ---------------- chapter detail (multilayered) ---------------- */
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

    const res = ch._res.filter((r) => !r.feature);
    const feature = ch._res.find((r) => r.feature);
    const levels = LEVEL_ORDER.filter((l) => res.some((r) => r.level === l));
    detailState = { ch, res, levels: new Set(), term: "" };

    const subs = (ch.subtopics || []).map((s) => `<span class="chip">${esc(s)}</span>`).join("");
    const levelPills = levels.map((l) => {
      const c = res.filter((r) => r.level === l).length;
      return `<button class="pill" data-level="${esc(l)}">${esc(l)}<span class="pc">${c}</span></button>`;
    }).join("");

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
            <div class="mrow"><span class="k">Weight</span><span class="v">${esc(ch.jeeWeight || "—")}</span></div>
            <div class="mrow"><span class="k">Resources</span><span class="v">${res.length}</span></div>
          </div>
        </div>

        ${feature ? `
        <article class="feature" style="margin-top:24px">
          <span class="f-ico" aria-hidden="true">∑</span>
          <div style="flex:1"><h4>${esc(feature.title)}</h4><p>${esc(feature.note)}</p></div>
          <a class="btn primary" href="${esc(feature.url)}" target="_blank" rel="noopener noreferrer">Open ↗</a>
        </article>` : ""}

        <div class="toolbar">
          <div class="toolbar-row">
            <div class="filter-search"><span class="s-ico" aria-hidden="true">⌕</span>
              <input id="detailSearch" type="search" placeholder="Filter within this chapter…" aria-label="Filter resources" autocomplete="off" /></div>
            <button class="btn" id="copyAll" type="button">⧉ Copy all visible links</button>
            <button class="btn" id="clearFilters" type="button">Reset</button>
          </div>
          <div class="facets"><div class="facet-row"><span class="f-label">Exam</span>${levelPills}</div></div>
        </div>

        <div class="result-meta">
          <span id="resultCount"><b>${res.length}</b> resources</span>
          <span class="cat-nav" id="catNav"></span>
        </div>
        <div id="sections"></div>
      </section>
    `;

    document.getElementById("detailSearch").addEventListener("input", (e) => { detailState.term = e.target.value.trim().toLowerCase(); applyDetailFilters(); });
    document.getElementById("copyAll").addEventListener("click", copyAllVisible);
    document.getElementById("clearFilters").addEventListener("click", clearFilters);
    app.querySelectorAll(".pill").forEach((p) => p.addEventListener("click", () => { p.classList.toggle("active"); const v = p.dataset.level; if (detailState.levels.has(v)) detailState.levels.delete(v); else detailState.levels.add(v); applyDetailFilters(); }));
    applyDetailFilters();
    window.scrollTo(0, 0);
  }

  function filteredResources() {
    const { res, levels, term } = detailState;
    return res.filter((r) => {
      if (levels.size && !levels.has(r.level)) return false;
      if (term) { const hay = (r.title + " " + r.note + " " + r.source + " " + r.type + " " + (r.query || "")).toLowerCase(); if (!hay.includes(term)) return false; }
      return true;
    });
  }

  function applyDetailFilters() {
    const filtered = filteredResources();
    document.getElementById("resultCount").innerHTML = `<b>${filtered.length}</b> of ${detailState.res.length} resources`;

    const byCat = {};
    filtered.forEach((r) => { (byCat[r.cat] = byCat[r.cat] || []).push(r); });

    const nav = CATS.filter((c) => byCat[c.key]).map((c, i) =>
      `<a class="cat-chip" href="#sec-${i}" data-i="${i}">${c.icon} ${esc(c.key)}<b>${byCat[c.key].length}</b></a>`
    ).join("");
    document.getElementById("catNav").innerHTML = nav;

    const sectionsEl = document.getElementById("sections");
    if (!filtered.length) { sectionsEl.innerHTML = emptyState("No matches — try clearing the exam filter."); return; }

    let html = "";
    CATS.forEach((c, i) => {
      const items = byCat[c.key];
      if (!items || !items.length) return;
      const cards = items.map((r, j) => {
        const delay = Math.min(j * 0.01, 0.3);
        const lvlClass = "lvl " + String(r.level || "Mixed").replace(/\s+/g, "-");
        return `
          <article class="res" style="animation-delay:${delay}s">
            <div class="res-badges"><span class="badge src">${esc(r.source)}</span><span class="badge">${esc(r.type)}</span><span class="${lvlClass}">${esc(r.level || "Mixed")}</span></div>
            <h4>${esc(r.title)}</h4>
            <p>${esc(r.note)}</p>
            <div class="res-actions">
              <a class="res-open" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">Open ↗</a>
              <button class="res-copy" type="button" title="Copy link" data-url="${esc(r.url)}" aria-label="Copy link">⧉</button>
            </div>
          </article>`;
      }).join("");
      html += `
        <section class="cat-section" id="sec-${i}">
          <div class="cat-head"><span class="cat-ico" aria-hidden="true">${c.icon}</span><h3>${esc(c.key)}</h3><span class="cat-count">${items.length}</span><span class="cat-line"></span></div>
          <p class="cat-blurb">${esc(c.blurb)}</p>
          <div class="res-grid">${cards}</div>
        </section>`;
    });
    sectionsEl.innerHTML = html;
    sectionsEl.querySelectorAll(".res-copy").forEach((b) => b.addEventListener("click", () => copyText(b.dataset.url, "Link copied")));
    document.querySelectorAll(".cat-chip").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); const el = document.getElementById("sec-" + a.dataset.i); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }));
  }

  function clearFilters() {
    detailState.term = ""; detailState.levels.clear();
    app.querySelectorAll(".pill.active").forEach((p) => p.classList.remove("active"));
    const ds = document.getElementById("detailSearch"); if (ds) ds.value = "";
    applyDetailFilters();
  }
  function copyAllVisible() {
    const list = filteredResources();
    const text = list.map((r) => `${r.title} (${r.source}) — ${r.url}`).join("\n");
    copyText(text, `Copied ${list.length} links`);
  }
  function emptyState(msg) { return `<div class="empty"><div class="e-ico">∅</div><p>${esc(msg)}</p></div>`; }

  /* ---------------- clipboard + toast ---------------- */
  let toastTimer;
  function toast(msg) { const t = document.getElementById("toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 1900); }
  function copyText(text, okMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => toast(okMsg)).catch(() => fallbackCopy(text, okMsg));
    else fallbackCopy(text, okMsg);
  }
  function fallbackCopy(text, okMsg) {
    const ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
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
      if (kind === "feedback") return;
      a.addEventListener("click", (e) => {
        if (kind === "home") { e.preventDefault(); location.hash = "#/"; }
        else if (kind === "guide") {
          e.preventDefault();
          const goScroll = () => { const el = document.getElementById("guide"); if (el) el.scrollIntoView({ behavior: "smooth" }); };
          if (location.hash.startsWith("#/chapter")) { location.hash = "#/"; setTimeout(goScroll, 60); } else goScroll();
        } else if (kind === "about") { e.preventDefault(); document.getElementById("about").scrollIntoView({ behavior: "smooth" }); }
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
    if (m) renderChapter(decodeURIComponent(m[1])); else renderHome();
  }
  function renderFooter() {
    const works = document.getElementById("footerWorks");
    if (works) works.innerHTML = FOOTER_WORKS.map((w) => `<li><a href="${esc(w.url)}" target="_blank" rel="noopener noreferrer"><span class="w-name">${esc(w.name)} ↗</span><span class="w-desc">${esc(w.desc)}</span></a></li>`).join("");
    const yr = document.getElementById("year"); if (yr) yr.textContent = new Date().getFullYear();
  }

  initTheme();
  initNav();
  renderFooter();
  window.addEventListener("hashchange", route);
  route();
})();
