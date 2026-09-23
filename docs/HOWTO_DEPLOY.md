# How to Deploy

This document explains how to load this plugin into a running DSH session.

## Prerequisites

* DSH ≥ (any version that ships Cordis dynamic plugins)
* Network access to `raw.githubusercontent.com` (the plugin pulls data from GitHub at first run)
* At least ~50 MB of free workspace space for the data cache

## Step 1 — Open a session

In DSH, open any conversation. The Plugin will be attached to *this* session only.

## Step 2 — Define the Cordis Package

Copy the entire contents of `src/host.js` and `src/client.js` from this repo and ask the Agent to
define them as a Cordis Package. The easiest way is to paste the bodies as shown below into a
model turn:

```text
cordis_define({
  plugin: { kind: 'new', idPrefix: 'ceten' },
  name: 'CET6 Tutor',
  purpose: 'CET-6 spaced-repetition tutor',
  code: {
    host:   '<paste src/host.js here>',
    client: '<paste src/client.js here>'
  }
})
```

The runtime returns:

```text
pluginId : ceten-1
packageId: pkg-N      (auto-assigned, e.g. pkg-5)
```

> The Host half **must** live in the same Package as the Client half — Cordis only activates the
> halves that belong to the currently-running Package, so splitting them across two Packages
> leaves you with no data layer.

## Step 3 — Run

```text
cordis_run({
  pluginId: 'ceten-1',
  packageId: 'pkg-5',     // the id returned above
  mode: 'run'              // first activation
})
```

The Client Package activation will require one-time approval in the UI. After approval the
plugin enters `state: running` and:

1. The Host boots, loads `user_vocab.json` and `cet6_tutor_cache.json` from the workspace.
2. If no cache exists, it fetches the four JSON files from
   `https://raw.githubusercontent.com/202704948-design/astrbot_plugin_cet6/master/` in parallel.
3. The Client registers a new section **CET6 Tutor** in the settings panel.

## Step 4 — Open the UI

Open **Settings → CET6 Tutor**. You should see five tabs:

| Tab | Purpose |
| --- | --- |
| 📊 总览 | Dashboard, exam countdown, reminder, data status |
| 🎴 单词 | Ebbinghaus flashcard + 进货 / 词库 management |
| 📖 阅读 | Draw, answer, auto-grade CET-6 reading questions |
| 🎧 听力 | Draw, stream audio, auto-grade listening sets |

## Step 5 — Use the dynamic Tools (optional)

Three Tools are registered for the Agent to invoke directly from chat:

| Tool | Args | Returns |
| --- | --- | --- |
| `cet6_lookup` | `{ word }` | `{ ok, word, meaning }` or `{ ok: false, msg }` |
| `cet6_review` | `{ limit? }` | `{ count, items: [{word, stage, meaning}, …] }` |
| `cet6_stats` | `{}` | Full progress + exam countdown |

In chat you can say:

```text
查一下 "abandon" 这个词（工具 cet6_lookup）
我今天有什么要复习的？
cet6_stats
```

## Step 6 — Updating

To upgrade the plugin later, define a new Package (the new host + client bodies) and `cordis_run`
with `mode: 'update'`:

```text
cordis_define({ plugin: { kind: 'existing', pluginId: 'ceten-1' }, … })
cordis_run({ pluginId: 'ceten-1', packageId: '<new>', mode: 'update' })
```

Old Packages stay in history as immutable versions; you can roll back by re-running them.

## Troubleshooting

* **No CET6 Tutor section in Settings** — the Client half failed to mount. Run
  `cordis_inspect_self({ pluginId: 'ceten-1', packageId: 'pkg-N' })` for diagnostics.
* **Word lookup returns `词库未收录`** — the data fetch didn't complete yet. Open the
  **总览** tab and click **🔄 重新从 GitHub 拉取数据**.
* **Audio fails to play** — the GitHub raw URL must be reachable from your browser; some
  corporate firewalls block it. The fallback link lets you download the MP3 manually.
* **`dynamic ctx does not expose "createElement"`** — you are using an older revision of
  `client.js` that did `const React = ctx`. Update to a Package built from the current source.

## Uninstall

```text
cordis_stop({ pluginId: 'ceten-1' })              // pause effects
cordis_undefine({ pluginId: 'ceten-1' })          // delete everything
```

Workspace caches (`cet6_tutor_user.json`, `cet6_tutor_cache.json`) are left behind and harmless.