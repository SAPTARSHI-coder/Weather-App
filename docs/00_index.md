# 📚 SkyGlass Documentation — Master Index

> This is your starting point. Every document is listed here with a one-line description.
> Read them in order the first time. Use them as reference after that.

---

## 🗺️ Reading Order (First Time)

| Order | File | What You Will Learn |
|---|---|---|
| 1 | [01_big_picture.md](./01_big_picture.md) | What problem SkyGlass solves and why it matters |
| 2 | [02_full_flow.md](./02_full_flow.md) | The complete story from search to dashboard |
| 3 | [03_engines_explained.md](./03_engines_explained.md) | All 12 intelligence engines, one-by-one |
| 4 | [04_features_explained.md](./04_features_explained.md) | APIs, caching, rate limiting, localStorage |
| 5 | [05_code_walkthrough.md](./05_code_walkthrough.md) | Every important file's code explained line by line |
| 6 | [06_examples.md](./06_examples.md) | Real city examples — watch the system think |
| 7 | [07_why_better.md](./07_why_better.md) | Why SkyGlass beats ordinary weather apps |
| 8 | [08_viva_summary.md](./08_viva_summary.md) | Quick-memorize summary for your viva |
| 9 | [09_viva_questions.md](./09_viva_questions.md) | 10 teacher questions with model answers |
| 10 | [10_glossary.md](./10_glossary.md) | Every technical term, explained in plain English (A–Z) |
| 11 | [11_study_card.md](./11_study_card.md) | ⚡ One-page last-minute revision card — read this morning of viva |
| Ref | [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) | Full original technical reference document |

---

## 🔍 Quick Reference — Find What You Need Fast

### "I need to explain what my project does"
→ [01_big_picture.md](./01_big_picture.md) + [07_why_better.md](./07_why_better.md)

### "I need to explain the flow step by step"
→ [02_full_flow.md](./02_full_flow.md)

### "Teacher asked me about a specific engine"
→ [03_engines_explained.md](./03_engines_explained.md)

### "I need to explain why I used a server / caching / multiple APIs"
→ [04_features_explained.md](./04_features_explained.md)

### "I need to explain specific code"
→ [05_code_walkthrough.md](./05_code_walkthrough.md)

### "I need a real example to walk through"
→ [06_examples.md](./06_examples.md)

### "My viva is tomorrow — what do I read?"
→ [08_viva_summary.md](./08_viva_summary.md) then [09_viva_questions.md](./09_viva_questions.md)

### "I don't understand a word"
→ [10_glossary.md](./10_glossary.md)

---

## 🏗️ Project File Map

```
Weather-App/
│
├── docs/                         ← You are here
│   ├── 00_index.md               ← This file
│   ├── 01_big_picture.md
│   ├── 02_full_flow.md
│   ├── 03_engines_explained.md
│   ├── 04_features_explained.md
│   ├── 05_code_walkthrough.md
│   ├── 06_examples.md
│   ├── 07_why_better.md
│   ├── 08_viva_summary.md
│   ├── 09_viva_questions.md
│   ├── 10_glossary.md
│   └── PROJECT_OVERVIEW.md
│
├── src/
│   └── weatherEngine/            ← 12 intelligence engine files
│       ├── normalizer.js
│       ├── fusionEngine.js
│       ├── conditionEngine.js
│       ├── realFeelEngine.js
│       ├── aqiHandler.js
│       ├── confidenceCalc.js
│       ├── trendEngine.js
│       ├── predictionEngine.js
│       ├── rainEngine.js
│       ├── anomalyEngine.js
│       ├── stabilityEngine.js
│       └── insightEngine.js
│
├── index.html                    ← Frontend structure (skeleton)
├── style.css                     ← Frontend design (styling)
├── script.js                     ← Frontend brain (interactivity)
├── mapUtils.js                   ← Interactive map logic
├── storageUtils.js               ← Browser memory (localStorage)
├── server.js                     ← Backend server (main)
├── .env                          ← Secret API keys (never on GitHub)
├── .gitignore                    ← Tells git what NOT to upload
├── package.json                  ← Project identity + npm scripts
└── vite.config.js                ← Build tool configuration
```

---

## ⚡ The 30-Second Pitch

> You're in a lift with your professor. You have 30 seconds.

*"SkyGlass is a weather intelligence system. Instead of showing a single number from one source, it fetches data from two independent weather APIs, blends them with weighted mathematics, and passes the result through 12 custom-built analysis engines. These engines compute things like real perceived temperature, rain probability, atmospheric trends, prediction for the next hour, danger anomaly alerts, and human-readable insights. Everything is secured behind a Node.js backend that protects API keys, caches responses, and rate-limits abuse. The result is a dashboard that doesn't just show weather — it understands it."*

---

*Built by Saptarshi Sadhu. Documentation written for learning, viva preparation, and future reference.*
