# Problem Atlas — JEE Advanced Mathematics

**A free, living map of the world's best mathematics problems for JEE Advanced — chapter by chapter.**

Every chapter has **~100 hand-curated, always-working links** to brilliant, strictly *in-syllabus* problems — pulled from Math StackExchange, Art of Problem Solving, MIT OCW, Paul's Online Notes, Brilliant, NCERT, official JEE Advanced past papers, and the best YouTube lectures. Built for teachers. Free for everyone.

> **27 chapters · 2,900+ curated links · 100% live · ₹0 forever**

Made by **Indrajeet Yadav** — Mathematics Faculty, ALLEN.

---

## Why this never breaks (the important part)

Old problem-link lists die because they point at **single problem pages**. Those URLs disappear — for example, **Brilliant deleted its entire community-problems section in 2021**, instantly killing every `brilliant.org/problems/...` link in the world.

Problem Atlas is built differently. Every link is one of two durable kinds:

1. **Live topic searches** — e.g. a Math StackExchange search for *"definite integral king property"*. One link = an endless, always-fresh stream of fully-solved problems. A search page can never 404.
2. **Stable landing pages** — official archives (jeeadv.ac.in), course homepages (MIT OCW, Paul's Notes), reference articles, and tool pages (Desmos, Wolfram Alpha).

So the links keep working for years, and each one quietly gets *better* as more solved problems are added online.

---

## How to use it (for teachers — 30 seconds)

1. **Open a chapter.** Tap any chapter card on the home page, or type in the search box.
2. **Filter by difficulty.** Inside a chapter, tap **JEE Main**, **JEE Advanced**, or **Olympiad** — and filter by **source** (Math SE, AoPS, YouTube…) or **type** (problem set, past paper, video…).
3. **Open or copy.** Hit **Open** to see live problems with solutions, or the **⧉** button to copy a link straight into your worksheet / WhatsApp group. **Copy all visible links** grabs the whole filtered set at once.
4. **Need fresh questions?** Every chapter links to **[Maths Prompt Studio](https://yosoyun.github.io/math-prompt-studio/)** — generate unlimited custom problems with AI in one click.

No login, no install, works on phone and computer, light & dark mode.

---

## Put it online (free, ~3 minutes)

This is a plain static website — just three files (`index.html`, `styles.css`, `app.js`) plus `data.js`. Host it free on **GitHub Pages**:

1. Create a new repository on GitHub, e.g. `jee-maths-problem-atlas`.
2. Upload every file in this folder (drag-and-drop works on github.com → *Add file → Upload files*).
3. Go to the repo's **Settings → Pages**.
4. Under *Build and deployment*, set **Source = Deploy from a branch**, **Branch = `main` / `root`**, and **Save**.
5. Wait ~1 minute. Your site is live at `https://<your-username>.github.io/jee-maths-problem-atlas/`.

That's it. To update later, edit a file on GitHub and it redeploys automatically.

---

## Adding or editing chapters (optional, for later)

All content lives in **`data.js`**. Each chapter is one object:

```js
{
  chapter: "Definite Integration",
  slug: "definite-integration",          // unique id, lowercase-with-dashes
  group: "Calculus",                      // Algebra | Trigonometry | Calculus | Coordinate Geometry | Vectors & 3D
  blurb: "One-line description.",
  jeeWeight: "High",                      // High | Medium | Variable
  subtopics: ["...", "..."],

  // Durable landing pages (shown as-is):
  anchors: [
    { title: "...", url: "https://...", source: "MIT OCW",
      type: "Problem set", level: "JEE Advanced", note: "What it gives." }
  ],

  // Problem themes — app.js turns each into live searches on the chosen sources:
  seeds: [
    { label: "King property of definite integrals",
      query: "definite integral king property",   // becomes a Math SE / AoPS / YouTube search
      level: "JEE Advanced",
      sources: ["mse", "aops", "youtube", "google", "pyq"] }
  ]
}
```

- `type` ∈ `Problem set · Topic page · Past papers · Course · Video · Reference · Tool · Search`
- `level` ∈ `JEE Main · JEE Advanced · Olympiad · Mixed`
- `sources` ∈ `mse` (Math StackExchange) · `aops` (Art of Problem Solving) · `youtube` · `google` · `pyq` (previous-year PDFs)

The site automatically expands seeds into ~100 link cards per chapter and builds the filters. Keep links to **search pages and stable landing pages** — never single problem URLs — so nothing ever breaks.

---

## Feedback & contact

Problems, ideas, or appreciation — all genuinely welcome. Every note helps this grow.

- ✉️ **indrajeetsirallen@gmail.com**
- 📸 Instagram **[@indrajeetsirallen](https://instagram.com/indrajeetsirallen)**
- ☎️ **+91 80729 65053**

### More free tools from the same teacher
- **[Maths Prompt Studio](https://yosoyun.github.io/math-prompt-studio/)** — 500+ AI prompts for maths teachers
- **[AI Prompt Library for Teachers](https://github.com/Yosoyun/ai-prompt-library-for-teachers)** — 200+ classroom prompts
- **[Limits Masterbook](https://github.com/Yosoyun/limits-masterbook)** — 100 advanced limit problems, multiple methods
- **[Ranker Masterbooks](https://github.com/Yosoyun/ranker-masterbooks)** — inverse-trig & limits, 200+ problems
- **[All projects on GitHub](https://github.com/Yosoyun)**

---

*Built with care by a teacher, for teachers. Please share it.*
