# 🎓 DSH CET6 Tutor

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Built for DSH](https://img.shields.io/badge/Built%20for-DSH-2563eb)](https://github.com/deepseek-ai/dsh)
[![Plugin: cordis](https://img.shields.io/badge/Plugin-cordis-success)](.)

> A spaced-repetition CET-6 (大学英语六级) tutor for [DSH](https://github.com/deepseek-ai/dsh).
> Built as a [Cordis](https://github.com/deepseek-ai/dsh) dynamic plugin with full Host + Client halves.

This project is a **DSH-native port** of the original AstrBot plugin
[`astrbot_plugin_cet6`](https://github.com/202704948-design/astrbot_plugin_cet6),
rebuilt with the modern DSH stack: **Host-side data + business logic**, **Client-side React UI**,
dynamic **Tools** callable by the Agent, and a **settings panel** shipped as a slot registration.

---

## ✨ Features

### 🧠 Ebbinghaus Memory Engine
* **7 mastery ranks**: `待定 🥚 → 模糊 📉 → 清晰 📈 → 记住 🧠 → 牢固 🛡️ → 掌握 🌟 → 精通 👑`
* **Adaptive intervals**: 12 h → 1 d → 2 d → 4 d → 7 d → 15 d
* **`/忘` forget penalty**: demote by 2 ranks; the next review moves forward to today
* **`/斩` one-shot kill**: jump straight to the "mastered" wall

### 📖 Reading Comprehension
* **96 real CET-6 reading passages** (Section A / B / C)
* **Auto-grading** with per-question breakdown and score
* **Anti-repeat tracker**: every done question is recorded; no repeats until you reset
* **Lazy mode**: `/查答案` to view answers without marking the question as done

### 🎧 Listening Comprehension
* **27 listening sets** (long dialogue / passages / lectures)
* **Streamed audio** directly from the original GitHub raw URL — no need to download
* **Auto-grading by question number** with section-aware scoring

### 📊 Dashboard & Reminder
* Live progress: review queue size, mastered count, reading / listening completion
* Next CET-6 exam countdown (June 13 / December 13)
* Daily reminder (in-session console toast)

### 🤖 Dynamic Tools (callable from chat)
| Tool | Description |
| :--- | :--- |
| `cet6_lookup` | Look up a CET-6 word's definition |
| `cet6_review` | Get the user's due-word list (Ebbinghaus schedule) |
| `cet6_stats` | Show overall progress + exam countdown |

---

## 📦 Data Source

All vocabulary, reading and listening data is **fetched at runtime** from
[202704948-design/astrbot_plugin_cet6](https://github.com/202704948-design/astrbot_plugin_cet6):

| Resource | URL |
| :--- | :--- |
| 5651-word vocabulary (sequential) | `…/master/4-CET6-顺序.json` |
| 96 reading passages | `…/master/CET6_Perfect_Verified.json` |
| Reading answer key | `…/master/CET6_Answer.json` |
| 27 listening sets | `…/master/listening_questions_v3.json` |
| Listening MP3s (streamed) | `…/master/CET-6听力/*.mp3` |

A workspace cache (`/cet6_tutor_cache.json`) is written after the first successful fetch so
subsequent reloads are instant.

---

## 🚀 Quick Start

### 1. Install DSH

If you don't have DSH yet, follow the upstream
[installation guide](https://github.com/deepseek-ai/dsh).

### 2. Define the Cordis Plugin

In any DSH session, ask the Agent to define the Plugin by submitting the function bodies in
`src/host.js` and `src/client.js` as a single Cordis Package. See
[`docs/HOWTO_DEPLOY.md`](./docs/HOWTO_DEPLOY.md) for the exact `cordis_define` payload.

```text
pluginId : ceten-1   (assigned by the runtime)
packageId: pkg-5     (the latest combined Host+Client version)
```

### 3. Activate

```text
cordis_run(pluginId='ceten-1', packageId='pkg-5', mode='run')
```

Approve the Client Package in the DSH UI when prompted. The first run will fetch data from
GitHub (a few seconds), then the Plugin is live.

### 4. Use it

* Open **Settings → CET6 Tutor**
* Tab **单词** → **进货** → pick 10–30 new words → **复习** with the spaced-repetition flashcard
* Tab **阅读** → random real passage → answer → submit → instant grading
* Tab **听力** → random listening set → stream audio → answer → grading
* Tab **总览** → set daily reminder, see exam countdown, reload data

In chat you can also ask the Agent things like:

* "用 cet6_lookup 查 abandon"
* "我今天有什么要复习的？"
* "cet6_stats"

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  Browser (DSH Client)                                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  CET6Tutor (settings.section → 'cet6-tutor')               │ │
│  │  ├─ DashboardView                                          │ │
│  │  ├─ VocabView       ──┐                                    │ │
│  │  ├─ ReadingView       │  React.createElement(...)         │ │
│  │  ├─ ListeningView     │  host.call('cet6/...')            │ │
│  │  └─ HelpView         ─┘                                    │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────┬─────────────────────────────────────────┘
                         │ JSON RPC (host.call / harness.handle)
┌────────────────────────┴─────────────────────────────────────────┐
│  DSH Host (Node.js)                                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  cordis plugin (ceten-1)                                   │ │
│  │  ├─ Vocab engine (Ebbinghaus)                              │ │
│  │  ├─ Reading engine (draw / grade / check)                  │ │
│  │  ├─ Listening engine (draw / grade / skip)                │ │
│  │  ├─ Persistence (fs: cet6_tutor_user.json, _cache.json)    │ │
│  │  ├─ Daily reminder timer                                   │ │
│  │  └─ Dynamic tools (cet6_lookup, cet6_review, cet6_stats)    │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────┬─────────────────────────────────────────┘
                         │ ctx.web.fetch
┌────────────────────────┴─────────────────────────────────────────┐
│  GitHub raw (202704948-design/astrbot_plugin_cet6/master)        │
└──────────────────────────────────────────────────────────────────┘
```

### File layout

```
dsh-cet6-tutor/
├── README.md            ← this document
├── LICENSE              ← AGPL-3.0 (matches the upstream)
├── .gitignore
├── src/
│   ├── host.js          ← Cordis host half (data + RPC + tools)
│   └── client.js        ← Cordis client half (React UI)
└── docs/
    └── HOWTO_DEPLOY.md  ← exact cordis_define payload to paste
```

---

## 🎯 UX Improvements over the original AstrBot Plugin

| Original (AstrBot) | This Plugin |
| --- | --- |
| HTML files generated per question, sent to chat | In-page React flashcard, no file noise |
| Chat commands (`/来篇阅读`, `/查答案`) | Tabs + buttons + dynamic tools |
| `done_*.json` written by Python side | Workspace `fs` writes, async-safe |
| Mastered / reviewing vocab in plain JSON | Indexed by `Object.create(null)` for O(1) lookups |
| Listeners embedded as base64 in HTML | Direct `<audio src="…raw…mp3">` streaming |

---

## 🛠 Development

```bash
# Lint the source files
node --check src/host.js
node --check src/client.js
```

To regenerate or patch the runtime in your session:

```text
cordis_define({ plugin: { kind: 'existing', pluginId: 'ceten-1' },
              name: '…', purpose: '…',
              code: { host: <contents of src/host.js>,
                      client: <contents of src/client.js> } })
cordis_run({ pluginId: 'ceten-1', packageId: '<returned>', mode: 'update' })
```

---

## 📜 License

GNU Affero General Public License v3.0 — see [`LICENSE`](./LICENSE) for the full text.

Inherited from the upstream data source at
[202704948-design/astrbot_plugin_cet6](https://github.com/202704948-design/astrbot_plugin_cet6),
which is also AGPL-3.0.

---

## 🙏 Credits

* **Author & maintainer**: [@alei37](https://github.com/alei37) — original AstrBot author
* **Original plugin**: [astrbot_plugin_cet6](https://github.com/202704948-design/astrbot_plugin_cet6)
* **Data source**: same upstream repo, fetched at runtime

> *"汗水绝对不会骗人，愿你在下一次大考中，旗开得胜！"* 🗡️