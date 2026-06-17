# Problem Atlas — JEE Advanced (Maths · Physics · Chemistry)

**A free, living map of the world's best problems for JEE Advanced — chapter by chapter, across all three subjects.**

Every chapter has **~100 hand-curated, always-working links** to brilliant, strictly *in-syllabus* problems — pulled from the Stack Exchanges, Art of Problem Solving, MIT OCW, Paul's Notes, the Feynman Lectures, LibreTexts, ChemGuide, NCERT, Brilliant, PhET, official JEE Advanced past papers, and the best YouTube lectures. Built for teachers. Free for everyone.

> **81 chapters · 8,900+ curated links · 100% live · ₹0 forever**
> Mathematics (27) · Physics (25) · Chemistry (29)

Made by **Indrajeet Yadav** — Mathematics Faculty, ALLEN.

---

## Why this never breaks (the important part)

Old problem-link lists die because they point at **single problem pages**. Those URLs disappear — for example, **Brilliant deleted its entire community-problems section in 2021**, instantly killing every `brilliant.org/problems/...` link in the world.

Problem Atlas is built differently. Every link is one of two durable kinds:

1. **Live topic searches** — e.g. a Math/Physics/Chemistry StackExchange search for *"definite integral king property"* or *"rolling without slipping"*. One link = an endless, always-fresh stream of fully-solved problems. A search page can never 404.
2. **Stable landing pages** — official archives (jeeadv.ac.in), course homepages (MIT OCW, Paul's Notes, Feynman Lectures), reference hubs (LibreTexts, ChemGuide, HyperPhysics, MathWorld, NCERT), and tools (Desmos, PhET, Wolfram Alpha).

So the links keep working for years, and each one quietly gets *better* as more solved problems are added online.

---

## How to use it (for teachers — 30 seconds)

1. **Pick a subject** — tap **Mathematics**, **Physics**, or **Chemistry**.
2. **Open a chapter.** Tap any chapter card, or type in the search box.
3. **Filter by difficulty.** Inside a chapter, tap **JEE Main**, **JEE Advanced**, or **Olympiad** — and filter by **source** and **type**.
4. **Open or copy.** Hit **Open** to see live problems with solutions, or **⧉** to copy a link straight into your worksheet / WhatsApp group. **Copy all visible links** grabs the whole filtered set at once.
5. **Need fresh questions?** Every chapter links to an AI prompt library — generate unlimited custom problems with ChatGPT/Claude in one click.

No login, no install, works on phone and computer, light & dark mode.

---

## Put it online (free, ~3 minutes)

This is a plain static website — `index.html`, `styles.css`, `app.js`, `data.js`. Host it free on **GitHub Pages**:

1. Create a new repository on GitHub.
2. Upload every file in this folder (drag-and-drop on github.com → *Add file → Upload files*).
3. Go to **Settings → Pages** → set **Source = Deploy from a branch**, **Branch = `main` / `root`**, **Save**.
4. Wait ~1 minute. Live at `https://<your-username>.github.io/<repo-name>/`.

To update later, edit a file on GitHub and it redeploys automatically.

---

## Adding or editing chapters (optional, for later)

All content lives in **`data.js`**. Each chapter is one object:

```js
{
  chapter: "Rotational Motion",
  slug: "rotational-motion",              // unique id, lowercase-with-dashes
  subject: "Physics",                     // Mathematics | Physics | Chemistry
  group: "Mechanics",                     // a teaching group within the subject
  blurb: "One-line description.",
  jeeWeight: "High",                      // High | Medium | Variable
  subtopics: ["...", "..."],

  // Durable landing pages (shown as-is):
  anchors: [
    { title: "...", url: "https://...", source: "MIT OCW",
      type: "Course", level: "JEE Advanced", note: "What it gives." }
  ],

  // Problem themes — app.js turns each into live searches on the chosen sources:
  seeds: [
    { label: "Rolling without slipping",
      query: "rolling without slipping",  // becomes a Physics SE / YouTube / Google search
      level: "JEE Advanced",
      sources: ["pse", "youtube", "google", "pyq"] }
  ]
}
```

- `type` ∈ `Problem set · Topic page · Past papers · Course · Video · Reference · Tool · Search`
- `level` ∈ `JEE Main · JEE Advanced · Olympiad · Mixed`
- `sources` ∈ `mse` (Math StackExchange) · `pse` (Physics SE) · `cse` (Chemistry SE) · `aops` (Art of Problem Solving) · `youtube` · `google` · `pyq` (previous-year PDFs)

The site auto-expands seeds into ~100 link cards per chapter and builds the subject tabs and filters. Keep links to **search pages and stable landing pages** — never single problem URLs — so nothing ever breaks.

---

## Feedback & contact

Problems, ideas, or appreciation — all genuinely welcome. Every note helps this grow.

- ✉️ **indrajeetsirallen@gmail.com**
- 📸 Instagram **[@indrajeetsirallen](https://instagram.com/indrajeetsirallen)**
- ☎️ **+91 80729 65053**

### More free tools from the same teacher
- **[ALLEN Resource Hub](https://yosoyun.github.io/allen-resource-hub/)** — every official ALLEN channel & link, in one place
- **[Maths Prompt Studio](https://yosoyun.github.io/math-prompt-studio/)** — 500+ AI prompts for maths teachers
- **[AI Prompt Library for Teachers](https://github.com/Yosoyun/ai-prompt-library-for-teachers)** — 200+ classroom prompts
- **[Limits Masterbook](https://github.com/Yosoyun/limits-masterbook)** — 100 advanced limit problems, multiple methods
- **[Ranker Masterbooks](https://github.com/Yosoyun/ranker-masterbooks)** — inverse-trig & limits, 200+ problems
- **[All projects on GitHub](https://github.com/Yosoyun)**

---

*Built with care by a teacher, for teachers. Please share it.*
