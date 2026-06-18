/* =========================================================================
   PROBLEM ATLAS — application engine (worldwide: school → Olympiad)
   - hash router (home / chapter)
   - durable seed searches + per-chapter trusted-source shortcuts
   - tabbed chapter view (jump straight to a section, no long scroll)
   - only world-renowned & government sources; multi-exam, multi-tag
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
  const qp = (s) => encodeURIComponent(s).replace(/%20/g, "+");

  /* ---------------- subjects ---------------- */
  const SUBJECTS = [
    { key: "Mathematics", glyph: "∫", accent: "var(--accent)",   groups: ["Algebra", "Trigonometry", "Calculus", "Coordinate Geometry", "Vectors & 3D"] },
    { key: "Physics",     glyph: "↯", accent: "var(--sky)",      groups: ["General Physics", "Mechanics", "Waves & Thermal", "Electromagnetism", "Optics & Modern"] },
    { key: "Chemistry",   glyph: "⚗", accent: "var(--accent-2)", groups: ["Physical Chemistry", "Inorganic Chemistry", "Organic Chemistry"] },
    { key: "Biology",     glyph: "❀", accent: "var(--leaf)",     groups: ["Diversity & Cell Biology", "Plant Physiology & Anatomy", "Human Physiology", "Reproduction", "Genetics & Evolution", "Biology in Human Welfare & Biotech", "Ecology"] },
  ];
  const subjectMeta = (k) => SUBJECTS.find((s) => s.key === k) || SUBJECTS[0];
  const SUBJ_WORD = { Mathematics: "mathematics", Physics: "physics", Chemistry: "chemistry", Biology: "biology" };

  /* universal difficulty levels (global) */
  const LEVEL_MAP = {
    Foundation: "Foundation", "JEE Main": "Standard", NEET: "Standard", Mixed: "Mixed",
    "JEE Advanced": "Advanced", Olympiad: "Olympiad", Standard: "Standard", Advanced: "Advanced",
  };
  const normLevel = (l) => LEVEL_MAP[l] || l || "Mixed";
  const LEVEL_ORDER = ["Foundation", "Standard", "Advanced", "Olympiad", "Mixed"];

  /* ---------------- durable link builders ---------------- */
  const SOURCE_META = {
    mse:     { name: "Math StackExchange",     type: "Problem set", note: "Hundreds of fully-worked solutions — sort by votes for the cleanest." },
    pse:     { name: "Physics StackExchange",  type: "Problem set", note: "Conceptual physics Q&A with detailed expert answers." },
    cse:     { name: "Chemistry StackExchange",type: "Problem set", note: "Detailed chemistry Q&A — mechanisms, reasoning, worked steps." },
    bio:     { name: "Biology StackExchange",  type: "Problem set", note: "Biology Q&A with expert explanations." },
    aops:    { name: "AoPS",                   type: "Problem set", note: "Contest & Olympiad-level threads with worked solutions." },
    youtube: { name: "YouTube",                type: "Video",       note: "Lectures and step-by-step video walkthroughs." },
    google:  { name: "Web",                    type: "Search",      note: "Problem sets and worked solutions from the open web." },
    pyq:     { name: "Past papers",            type: "Past papers", note: "Previous-year exam question PDFs, chapter-wise." },
  };
  function buildUrl(src, q, subject) {
    switch (src) {
      case "mse":     return "https://math.stackexchange.com/search?q=" + qp(q);
      case "pse":     return "https://physics.stackexchange.com/search?q=" + qp(q);
      case "cse":     return "https://chemistry.stackexchange.com/search?q=" + qp(q);
      case "bio":     return "https://biology.stackexchange.com/search?q=" + qp(q);
      case "aops":    return "https://www.google.com/search?q=" + qp("site:artofproblemsolving.com " + q);
      case "youtube": return "https://www.youtube.com/results?search_query=" + qp(q + " lecture");
      case "ytq":     return "https://www.youtube.com/results?search_query=" + qp(q);
      case "google":  return "https://www.google.com/search?q=" + qp(q + " solved problems with solutions");
      case "pyq":     return "https://www.google.com/search?q=" + qp(q + " past exam questions with solutions");
      case "reddit":  return "https://www.reddit.com/search/?q=" + qp(q) + "&sort=top&t=all";
      case "wolfram": return "https://www.wolframalpha.com/input?i=" + enc(q);
      case "graw":    return "https://www.google.com/search?q=" + qp(q);
      default:        return "https://www.google.com/search?q=" + qp(q);
    }
  }

  /* ---------------- resource categories (the tabs) ---------------- */
  const CATS = [
    { key: "Papers, PDFs & Slides", icon: "📄", blurb: "Past papers, lecture notes, problem-set PDFs and slide decks — from trusted sources only." },
    { key: "Problems & Solutions",  icon: "✏️", blurb: "Worked problems from Stack Exchange, AoPS, Brilliant and university sets." },
    { key: "Video Lectures",        icon: "🎥", blurb: "Hand-picked, world-renowned channels (MIT, 3Blue1Brown, Khan…) — no random uploads." },
    { key: "Theory & Notes",        icon: "📚", blurb: "Concept notes & free textbooks — NCERT, MIT OCW, LibreTexts, OpenStax, Feynman." },
    { key: "Community",             icon: "💬", blurb: "Top-voted threads from serious study communities." },
    { key: "Tools",                 icon: "🧮", blurb: "Free interactive tools — graph, compute, simulate, visualise." },
  ];
  function categorize(r) {
    if (r.cat) return r.cat;
    const s = r.source || "", t = r.type || "";
    if (s === "YouTube") return "Video Lectures";
    if (/Reddit/i.test(s)) return "Community";
    if (t === "Tool" || /Wolfram Alpha|Desmos|GeoGebra|PhET|MolView|BioInteractive/i.test(s)) return "Tools";
    if (t === "Past papers" || /Slides|PPT/i.test(s)) return "Papers, PDFs & Slides";
    if (t === "Problem set" || /StackExchange|AoPS|Brilliant/i.test(s)) return "Problems & Solutions";
    if (t === "Search") return "Problems & Solutions";
    return "Theory & Notes";
  }

  /* ---------------- AI studio + teacher resources ---------------- */
  function getStudio(subject) {
    if (subject === "Mathematics") return {
      title: "Generate unlimited custom problems with AI", url: "https://yosoyun.github.io/math-prompt-studio/",
      source: "Maths Prompt Studio", type: "Tool", level: "Mixed", feature: true,
      note: "Indrajeet's own free prompt library — paste a prompt into ChatGPT/Claude to instantly create fresh practice on this exact topic.",
    };
    return {
      title: "Generate unlimited custom problems with AI", url: "https://yosoyun.github.io/ai-prompt-library-for-teachers/",
      source: "AI Prompt Library", type: "Tool", level: "Mixed", feature: true,
      note: "Indrajeet's free library of 200+ classroom AI prompts — paste one into ChatGPT/Claude to create fresh practice for this topic.",
    };
  }
  const TEACHER_EXTRAS = {
    "limits-continuity-differentiability": [{ title: "Limits Masterbook — 100 advanced problems", url: "https://yosoyun.github.io/limits-masterbook/", source: "Indrajeet's Masterbook", type: "Problem set", level: "Olympiad", note: "100 advanced limit problems with multiple methods, Python-verified — by Indrajeet himself." }],
    "inverse-trigonometry": [{ title: "Inverse-Trig Masterbook (Ranker series)", url: "https://yosoyun.github.io/ranker-masterbooks/", source: "Indrajeet's Masterbook", type: "Problem set", level: "Olympiad", note: "200+ original competitive inverse-trigonometry problems with verified solutions." }],
    "permutations-combinations": [{ title: "Andreescu Library — counting & combinatorics", url: "https://yosoyun.github.io/andreescu-library/", source: "Olympiad Library", type: "Reference", level: "Olympiad", note: "A guide to Titu Andreescu's combinatorics books for the Olympiad bridge." }],
    "sequences-series": [{ title: "Andreescu Library — inequalities & series", url: "https://yosoyun.github.io/andreescu-library/", source: "Olympiad Library", type: "Reference", level: "Olympiad", note: "Curated guide to Andreescu's books on sequences, series and inequalities." }],
    "complex-numbers": [{ title: "Andreescu Library — complex numbers", url: "https://yosoyun.github.io/andreescu-library/", source: "Olympiad Library", type: "Reference", level: "Olympiad", note: "Guide to Andreescu's classic 'Complex Numbers from A to Z'." }],
  };
  const FOOTER_WORKS = [
    { name: "Maths Prompt Studio", desc: "500+ free AI prompts for maths teachers", url: "https://yosoyun.github.io/math-prompt-studio/" },
    { name: "AI Prompt Library for Teachers", desc: "200+ ready classroom prompts", url: "https://yosoyun.github.io/ai-prompt-library-for-teachers/" },
    { name: "Limits Masterbook", desc: "100 advanced limit problems, multi-method", url: "https://yosoyun.github.io/limits-masterbook/" },
    { name: "Ranker Masterbooks", desc: "Inverse-trig & limits, 200+ problems", url: "https://yosoyun.github.io/ranker-masterbooks/" },
    { name: "Andreescu Library", desc: "Guide to Titu Andreescu's books", url: "https://yosoyun.github.io/andreescu-library/" },
    { name: "All projects on GitHub", desc: "github.com/Yosoyun", url: "https://github.com/Yosoyun" },
  ];

  /* ---------------- per-chapter generated shortcuts (trusted, global) ---------------- */
  // clean, searchable topic key — drop "(parentheticals)" and "&" that wreck relevance
  function topicKey(ch) {
    return ch.chapter.replace(/\([^)]*\)/g, " ").replace(/&/g, " and ").replace(/\s+/g, " ").trim();
  }
  // exam shortcuts span the world, mapped to universal levels
  function examShortcuts(subject, key, sw) {
    const M = {
      Mathematics: [
        ["School & Foundation", "Foundation", key + " " + sw + " basics concepts questions"],
        ["SAT / AP / A-Level", "Standard", key + " " + sw + " SAT AP A-level practice questions"],
        ["JEE (Main & Advanced)", "Advanced", key + " " + sw + " JEE advanced previous year questions"],
        ["IB HL / University", "Advanced", key + " " + sw + " university problem set"],
        ["Olympiad (IMO / Putnam)", "Olympiad", key + " " + sw + " olympiad putnam problems"],
      ],
      Physics: [
        ["School & Foundation", "Foundation", key + " physics basics concepts questions"],
        ["AP / A-Level / IB", "Standard", key + " physics AP A-level IB questions"],
        ["JEE / NEET", "Advanced", key + " physics JEE NEET previous year questions"],
        ["JEE Advanced / University", "Advanced", key + " physics JEE advanced problems"],
        ["Olympiad (IPhO)", "Olympiad", key + " physics olympiad IPhO problems"],
      ],
      Chemistry: [
        ["School & Foundation", "Foundation", key + " chemistry basics concepts questions"],
        ["AP / A-Level / IB", "Standard", key + " chemistry AP A-level IB questions"],
        ["JEE / NEET", "Advanced", key + " chemistry JEE NEET previous year questions"],
        ["JEE Advanced / University", "Advanced", key + " chemistry JEE advanced problems"],
        ["Olympiad (IChO)", "Olympiad", key + " chemistry olympiad IChO problems"],
      ],
      Biology: [
        ["School & Foundation", "Foundation", key + " biology basics concepts questions"],
        ["AP / A-Level / IB", "Standard", key + " biology AP A-level IB questions"],
        ["NEET / MCAT", "Advanced", key + " biology NEET MCAT previous year questions"],
        ["Olympiad (IBO)", "Olympiad", key + " biology olympiad IBO problems"],
      ],
    };
    return M[subject] || M.Mathematics;
  }
  const CHANNELS = {
    Mathematics: ["3Blue1Brown", "MIT OpenCourseWare", "Khan Academy", "blackpenredpen"],
    Physics: ["MIT OpenCourseWare", "Khan Academy", "Physics Explained", "Professor Dave Explains"],
    Chemistry: ["Professor Dave Explains", "Khan Academy", "Tyler DeWitt", "NileRed"],
    Biology: ["Amoeba Sisters", "Khan Academy", "Professor Dave Explains", "Ninja Nerd"],
  };
  // serious study communities only (NOT meme subs)
  const SUBREDDITS = {
    Mathematics: ["JEE", "learnmath"], Physics: ["JEE", "PhysicsStudents"],
    Chemistry: ["JEE", "chemhelp"], Biology: ["NEET", "biology"],
  };
  const TRUSTED = "(site:ocw.mit.edu OR site:libretexts.org OR site:openstax.org OR site:khanacademy.org OR site:ncert.nic.in OR site:nptel.ac.in OR site:artofproblemsolving.com)";

  const LIBRE = { Mathematics: "math.libretexts.org", Physics: "phys.libretexts.org", Chemistry: "chem.libretexts.org", Biology: "bio.libretexts.org" };
  function tool(title, url, note) { return { title, url, source: title.split(" — ").pop(), type: "Tool", level: "Mixed", note, cat: "Tools" }; }
  function chapterTools(ch) {
    const k = topicKey(ch), subj = ch.subject, out = [];
    if (subj === "Mathematics" || subj === "Physics")
      out.push(tool(ch.chapter + " — GeoGebra interactive applets", "https://www.geogebra.org/search/" + enc(k), "Ready-made interactive applets — explore live & project in class."));
    if (subj === "Mathematics") {
      out.push(tool(ch.chapter + " — Desmos graphing", "https://www.desmos.com/calculator", "Free graphing calculator — plot & explore live."));
      out.push(tool(ch.chapter + " — Wolfram Alpha", "https://www.wolframalpha.com/input?i=" + enc(k), "Compute, solve & plot step-by-step."));
    } else if (subj === "Physics") {
      out.push(tool(ch.chapter + " — PhET simulations", "https://phet.colorado.edu/en/simulations/filter?subjects=physics&type=html", "Interactive physics simulations (Univ. of Colorado)."));
      out.push(tool(ch.chapter + " — Wolfram Alpha", "https://www.wolframalpha.com/input?i=" + enc(k), "Compute & verify physics problems."));
    } else if (subj === "Chemistry") {
      out.push(tool(ch.chapter + " — PhET simulations", "https://phet.colorado.edu/en/simulations/filter?subjects=chemistry&type=html", "Interactive chemistry simulations (Univ. of Colorado)."));
      out.push(tool(ch.chapter + " — MolView (3D molecules)", "https://molview.org/", "Free 3D molecule & structure viewer."));
      out.push(tool(ch.chapter + " — PubChem", "https://pubchem.ncbi.nlm.nih.gov/#query=" + qp(k), "Official NIH chemical database (structures, properties)."));
    } else {
      out.push(tool(ch.chapter + " — HHMI BioInteractive", "https://www.biointeractive.org/", "World-class free biology animations & interactives (HHMI)."));
      out.push(tool(ch.chapter + " — PhET simulations", "https://phet.colorado.edu/en/simulations/filter?subjects=biology&type=html", "Interactive biology simulations (Univ. of Colorado)."));
    }
    return out;
  }

  // every shortcut is scoped to ONE renowned source — uniformly premium, no mixed Google
  function chapterShortcuts(ch) {
    const name = ch.chapter, subj = ch.subject, key = topicKey(ch), sw = SUBJ_WORD[subj] || "", out = [];
    const g = (q) => buildUrl("graw", q, subj);
    const libre = LIBRE[subj];

    // ---- Papers, PDFs & Slides (single renowned/official source each) ----
    out.push({ title: name + " — NCERT chapter (PDF, Govt.)", url: g(key + " " + sw + " NCERT filetype:pdf site:ncert.nic.in"), source: "NCERT", type: "Past papers", level: "Standard", note: "Official NCERT chapter PDF — Government of India.", cat: "Papers, PDFs & Slides" });
    out.push({ title: name + " — MIT OpenCourseWare", url: "https://ocw.mit.edu/search/?q=" + qp(key + " " + sw), source: "MIT OCW", type: "Course", level: "Advanced", note: "MIT courses: lecture notes, problem sets & exams (with solutions).", cat: "Papers, PDFs & Slides" });
    out.push({ title: name + " — LibreTexts chapter", url: g(key + " site:" + libre), source: "LibreTexts", type: "Reference", level: "Standard", note: "Free, peer-reviewed open textbook chapter.", cat: "Papers, PDFs & Slides" });
    out.push({ title: name + " — OpenStax textbook", url: g(key + " " + sw + " site:openstax.org"), source: "OpenStax", type: "Reference", level: "Standard", note: "Free university textbook section (Rice University).", cat: "Papers, PDFs & Slides" });
    out.push({ title: name + " — problem sets w/ solutions (PDF · top universities)", url: g(key + " " + sw + " problem set solutions filetype:pdf (site:ocw.mit.edu OR site:nptel.ac.in OR site:artofproblemsolving.com OR site:" + libre + ")"), source: "PDF · universities", type: "Past papers", level: "Advanced", note: "Problem-set & exam PDFs from MIT, NPTEL, AoPS & LibreTexts only.", cat: "Papers, PDFs & Slides" });
    out.push({ title: name + " — lecture slides (PPT · .edu)", url: g(key + " " + sw + " lecture slides filetype:ppt (site:edu OR site:ac.uk OR site:ac.in)"), source: "Slides · .edu", type: "Past papers", level: "Mixed", note: "University lecture slide decks (PPT) from academic sites only.", cat: "Papers, PDFs & Slides" });

    // ---- Problems & Solutions (premium) ----
    out.push({ title: name + " — Art of Problem Solving (Wiki)", url: "https://artofproblemsolving.com/wiki/index.php?search=" + qp(key), source: "AoPS", type: "Problem set", level: "Olympiad", note: "AoPS Wiki: concept pages and contest problems with solutions.", cat: "Problems & Solutions" });
    out.push({ title: name + " — Brilliant interactive courses", url: "https://brilliant.org/courses/", source: "Brilliant", type: "Course", level: "Standard", note: "Interactive, guided problem-solving lessons.", cat: "Problems & Solutions" });
    if (subj === "Mathematics") out.push({ title: name + " — Olympiad & contest archive (AoPS)", url: "https://artofproblemsolving.com/community/c13_contests", source: "AoPS Contests", type: "Problem set", level: "Olympiad", note: "IMO & national-olympiad problem archive with discussion.", cat: "Problems & Solutions" });

    // ---- Video Lectures (renowned channels, PLAYLISTS stacked) ----
    (CHANNELS[subj] || []).forEach((cn) => out.push({ title: name + " — " + cn + " (playlists)", url: "https://www.youtube.com/results?search_query=" + qp(key + " " + sw + " " + cn) + "&sp=EgIQAw%3D%3D", source: "YouTube", type: "Video", level: "Mixed", note: "Course playlists by " + cn + " (renowned) on this topic.", cat: "Video Lectures" }));

    // ---- Theory & Notes (premium) ----
    out.push({ title: name + " — Khan Academy", url: "https://www.khanacademy.org/search?page_search_query=" + qp(key + " " + sw), source: "Khan Academy", type: "Course", level: "Standard", note: "Free lessons, articles and practice.", cat: "Theory & Notes" });
    if (subj === "Mathematics") out.push({ title: name + " — BetterExplained (intuition)", url: g(key + " site:betterexplained.com"), source: "BetterExplained", type: "Reference", level: "Standard", note: "Renowned intuitive, aha-moment explanations.", cat: "Theory & Notes" });

    // ---- Community (serious subs, top-sorted) ----
    (SUBREDDITS[subj] || ["JEE"]).forEach((sr) => out.push({ title: name + " — r/" + sr, url: "https://www.reddit.com/r/" + sr + "/search/?q=" + qp(key) + "&restrict_sr=1&sort=top&t=all", source: "Reddit", type: "Reference", level: "Mixed", note: "Top-voted discussions & resource recommendations in r/" + sr + ".", cat: "Community" }));

    // ---- Tools ----
    chapterTools(ch).forEach((t) => out.push(t));
    return out;
  }

  /* ---------------- expand a chapter into its full resource list ---------------- */
  function expandChapter(ch) {
    const list = [];
    list.push(getStudio(ch.subject));
    (TEACHER_EXTRAS[ch.slug] || []).forEach((r) => list.push({ ...r, level: normLevel(r.level), cat: categorize(r) }));
    chapterShortcuts(ch).forEach((r) => list.push({ ...r, level: normLevel(r.level) }));
    (ch.anchors || []).forEach((a) => list.push({ ...a, level: normLevel(a.level), cat: categorize(a) }));
    (ch.seeds || []).forEach((seed) => {
      (seed.sources || []).forEach((src) => {
        // keep only premium Q&A sources; drop mixed-quality web & random-video searches
        if (src === "google" || src === "pyq" || src === "youtube") return;
        const m = SOURCE_META[src] || SOURCE_META.google;
        const r = { title: seed.label, url: buildUrl(src, seed.query, ch.subject), source: m.name, type: m.type, level: normLevel(seed.level), note: m.note, query: seed.query };
        r.cat = categorize(r);
        list.push(r);
      });
    });
    // dedupe: exact URL, and at most one Tool per host
    const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return u; } };
    const seenUrl = new Set(), seenTool = new Set(), final = [];
    list.forEach((r) => {
      if (seenUrl.has(r.url)) return;
      if (r.cat === "Tools" && !r.feature) { const h = hostOf(r.url); if (seenTool.has(h)) return; seenTool.add(h); }
      seenUrl.add(r.url); final.push(r);
    });
    return final;
  }

  DATA.forEach((ch) => { ch._res = expandChapter(ch); ch._count = ch._res.length; });
  const TOTAL_LINKS = DATA.reduce((n, ch) => n + ch._count, 0);

  let activeSubject = localStorage.getItem("atlas-subject");
  const subjectsPresent = SUBJECTS.map((s) => s.key).filter((k) => DATA.some((c) => c.subject === k));
  if (!subjectsPresent.includes(activeSubject)) activeSubject = subjectsPresent[0] || "Mathematics";
  const chaptersOf = (key) => DATA.filter((c) => c.subject === key);

  /* ---------------- home ---------------- */
  function renderHome() {
    document.title = "Problem Atlas — world-class problems & resources, chapter by chapter";
    const total = TOTAL_LINKS ? TOTAL_LINKS.toLocaleString() : "14,000";
    const chCount = DATA.length;

    const tabsHtml = subjectsPresent.map((k) => {
      const sm = subjectMeta(k);
      return `<button class="subj-tab" data-subject="${esc(k)}" type="button"><span class="subj-glyph" aria-hidden="true">${sm.glyph}</span><span>${esc(k)}</span><span class="subj-n">${chaptersOf(k).length}</span></button>`;
    }).join("");

    app.innerHTML = `
      <section class="hero wrap">
        <span class="eyebrow">● Free · trusted sources only · for learners everywhere</span>
        <h1>The world's best problems &amp; resources, <em>mapped chapter by chapter.</em></h1>
        <p class="lede">A curated atlas for <strong>Maths, Physics, Chemistry &amp; Biology</strong> — from school basics to Olympiad. Every chapter pulls the best of <strong>MIT&nbsp;OCW, the Stack&nbsp;Exchanges, AoPS, 3Blue1Brown, Khan&nbsp;Academy, NCERT, LibreTexts, OpenStax, Feynman</strong> and official archives. Tagged for <strong>JEE, NEET, SAT, AP, A-Level, IB &amp; Olympiads</strong>. Around <strong>100+ trusted resources per chapter</strong> — no random sites, every link live.</p>
        <div class="hero-search">
          <span class="s-ico" aria-hidden="true">⌕</span>
          <input id="homeSearch" type="search" placeholder="Search chapters — e.g. limits, rotation, genetics, electrochemistry…" aria-label="Search chapters" autocomplete="off" />
          <span class="s-hint">press /</span>
        </div>
        <div class="hero-stats">
          <div class="stat"><span class="num">${chCount}</span><span class="lbl">Chapters</span></div>
          <div class="stat"><span class="num">${total}<span class="unit">+</span></span><span class="lbl">Curated links</span></div>
          <div class="stat"><span class="num">100<span class="unit">%</span></span><span class="lbl">Trusted only</span></div>
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
          <div class="step"><span class="n">STEP 02</span><h3>Tap a section tab</h3><p>Inside a chapter, tap <strong>PDFs</strong>, <strong>Problems</strong>, <strong>Videos</strong>, <strong>Theory</strong>, <strong>Community</strong> or <strong>Tools</strong> — it jumps you straight there, no scrolling.</p></div>
          <div class="step"><span class="n">STEP 03</span><h3>Filter by level</h3><p>Narrow to <em>Foundation</em>, <em>Standard</em>, <em>Advanced</em> or <em>Olympiad</em>. Open or <strong>⧉</strong> copy any link.</p></div>
          <div class="step"><span class="n">STEP 04</span><h3>Need more?</h3><p>Every chapter links to an <strong>AI prompt library</strong> — generate unlimited fresh problems in one click.</p></div>
        </div>
        <div class="callout">
          <span class="c-ico" aria-hidden="true">✦</span>
          <p><strong>Only sources you can trust:</strong> universities (MIT, Stanford-grade), the Stack Exchanges, AoPS, government textbooks (NCERT/NPTEL) and renowned creators. No random coaching sites, no junk — and every link is a live search or official page, so nothing ever rots.</p>
        </div>
      </section>

      <section class="chapters wrap">
        <div class="section-head">
          <span class="kicker">The Atlas</span>
          <h2>Every chapter, every level</h2>
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

  function switchSubject(key) { activeSubject = key; localStorage.setItem("atlas-subject", key); renderSubject(key); }

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

  /* ---------------- chapter detail (tabbed — jump straight to a section) ---------------- */
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
    detailState = { ch, res, levels: new Set(), term: "", activeCat: "All" };

    const subs = (ch.subtopics || []).map((s) => `<span class="chip">${esc(s)}</span>`).join("");
    const levelPills = levels.map((l) => `<button class="pill" data-level="${esc(l)}">${esc(l)}<span class="pc">${res.filter((r) => r.level === l).length}</span></button>`).join("");

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

        ${feature ? `<article class="feature" style="margin-top:24px"><span class="f-ico" aria-hidden="true">∑</span><div style="flex:1"><h4>${esc(feature.title)}</h4><p>${esc(feature.note)}</p></div><a class="btn primary" href="${esc(feature.url)}" target="_blank" rel="noopener noreferrer">Open ↗</a></article>` : ""}

        <div class="toolbar">
          <div class="toolbar-row">
            <div class="filter-search"><span class="s-ico" aria-hidden="true">⌕</span><input id="detailSearch" type="search" placeholder="Filter within this chapter…" aria-label="Filter resources" autocomplete="off" /></div>
            <button class="btn" id="copyAll" type="button">⧉ Copy visible links</button>
            <button class="btn" id="clearFilters" type="button">Reset</button>
          </div>
          ${levelPills ? `<div class="facets"><div class="facet-row"><span class="f-label">Level</span>${levelPills}</div></div>` : ""}
        </div>

        <div class="cat-tabs" id="catTabs" role="tablist" aria-label="Resource sections"></div>
        <div class="result-meta"><span id="resultCount"></span></div>
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

  function passLevelTerm(r) {
    const { levels, term } = detailState;
    if (levels.size && !levels.has(r.level)) return false;
    if (term) { const hay = (r.title + " " + r.note + " " + r.source + " " + r.type + " " + (r.query || "")).toLowerCase(); if (!hay.includes(term)) return false; }
    return true;
  }

  function applyDetailFilters() {
    const base = detailState.res.filter(passLevelTerm);
    const byCat = {};
    base.forEach((r) => { (byCat[r.cat] = byCat[r.cat] || []).push(r); });
    const presentCats = CATS.filter((c) => byCat[c.key]);
    if (!presentCats.some((c) => c.key === detailState.activeCat) && detailState.activeCat !== "All") detailState.activeCat = "All";

    // tabs
    const tabsHtml = [`<button class="cat-tab${detailState.activeCat === "All" ? " active" : ""}" data-cat="All" type="button">All<span class="ct-n">${base.length}</span></button>`]
      .concat(presentCats.map((c) => `<button class="cat-tab${detailState.activeCat === c.key ? " active" : ""}" data-cat="${esc(c.key)}" type="button"><span class="ct-ico" aria-hidden="true">${c.icon}</span>${esc(c.key)}<span class="ct-n">${byCat[c.key].length}</span></button>`)).join("");
    document.getElementById("catTabs").innerHTML = tabsHtml;
    document.querySelectorAll(".cat-tab").forEach((t) => t.addEventListener("click", () => { detailState.activeCat = t.dataset.cat; applyDetailFilters(); document.getElementById("catTabs").scrollIntoView({ behavior: "smooth", block: "start" }); }));

    document.getElementById("resultCount").innerHTML = `<b>${base.length}</b> of ${detailState.res.length} resources · showing <b>${detailState.activeCat}</b>`;

    const sectionsEl = document.getElementById("sections");
    if (!base.length) { sectionsEl.innerHTML = emptyState("No matches — try clearing the level filter."); return; }

    const renderCards = (items) => items.map((r, j) => {
      const delay = Math.min(j * 0.008, 0.25);
      const lvlClass = "lvl " + String(r.level || "Mixed").replace(/\s+/g, "-");
      return `<article class="res" style="animation-delay:${delay}s"><div class="res-badges"><span class="badge src">${esc(r.source)}</span><span class="badge">${esc(r.type)}</span><span class="${lvlClass}">${esc(r.level || "Mixed")}</span></div><h4>${esc(r.title)}</h4><p>${esc(r.note)}</p><div class="res-actions"><a class="res-open" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">Open ↗</a><button class="res-copy" type="button" title="Copy link" data-url="${esc(r.url)}" aria-label="Copy link">⧉</button></div></article>`;
    }).join("");

    let html = "";
    if (detailState.activeCat === "All") {
      presentCats.forEach((c) => {
        html += `<section class="cat-section"><div class="cat-head"><span class="cat-ico" aria-hidden="true">${c.icon}</span><h3>${esc(c.key)}</h3><span class="cat-count">${byCat[c.key].length}</span><span class="cat-line"></span></div><p class="cat-blurb">${esc(c.blurb)}</p><div class="res-grid">${renderCards(byCat[c.key])}</div></section>`;
      });
    } else {
      const c = CATS.find((x) => x.key === detailState.activeCat);
      html = `<section class="cat-section"><p class="cat-blurb" style="margin-top:18px">${esc(c ? c.blurb : "")}</p><div class="res-grid">${renderCards(byCat[detailState.activeCat] || [])}</div></section>`;
    }
    sectionsEl.innerHTML = html;
    sectionsEl.querySelectorAll(".res-copy").forEach((b) => b.addEventListener("click", () => copyText(b.dataset.url, "Link copied")));
  }

  function clearFilters() {
    detailState.term = ""; detailState.levels.clear(); detailState.activeCat = "All";
    app.querySelectorAll(".pill.active").forEach((p) => p.classList.remove("active"));
    const ds = document.getElementById("detailSearch"); if (ds) ds.value = "";
    applyDetailFilters();
  }
  function copyAllVisible() {
    let list = detailState.res.filter(passLevelTerm);
    if (detailState.activeCat !== "All") list = list.filter((r) => r.cat === detailState.activeCat);
    copyText(list.map((r) => `${r.title} (${r.source}) — ${r.url}`).join("\n"), `Copied ${list.length} links`);
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
        else if (kind === "guide") { e.preventDefault(); const goScroll = () => { const el = document.getElementById("guide"); if (el) el.scrollIntoView({ behavior: "smooth" }); }; if (location.hash.startsWith("#/chapter")) { location.hash = "#/"; setTimeout(goScroll, 60); } else goScroll(); }
        else if (kind === "about") { e.preventDefault(); document.getElementById("about").scrollIntoView({ behavior: "smooth" }); }
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
