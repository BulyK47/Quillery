# Quillery

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)

**Quillery** — organize, optimize and reuse your AI prompts. One React +
TypeScript codebase ships to **three targets**:

| Target | How it runs | Notes |
| --- | --- | --- |
| **Browser extension** | Side panel (Chrome / Edge, MV3) | Docks to the side, stays open while you work |
| **Desktop app** | Electron | Resizable native window |
| **Web app** | Any static host | Plain SPA |

## Features

- **Prompts** with title, content, category, tags, ⭐ rating, usage count, pin/favorite
- **Variables** — `{{name}}` placeholders → fill dialog with live preview → copy with values
- **Categories** — full CRUD with emoji + color + name
- **Search** (fuzzy, Fuse.js) + category filter + sort (most used / rating / recent / A-Z / pinned)
- **Statistics** — totals, characters, estimated tokens, uses, “By Category”, “Most Used”
- **Prompt Optimizer** — local, rule-based rewriting for ChatGPT / Claude / Gemini (no API, no keys, nothing leaves your machine)
- **Open in ChatGPT / Claude / Gemini** — one-click handoff that opens a prompt in your existing logged-in chat session (no account linking, no key)
- **Portable backup** — export a single `quillery-backup-*.json` and import it on another device (Merge or Replace); plus Markdown export for sharing
- **Cross-device sync (optional, no accounts)** — desktop: point Quillery at a OneDrive/Dropbox folder and it keeps a JSON file in sync across your computers; extension: stored in `chrome.storage.local`
- **Dark / light / system** theme, keyboard shortcuts
- Data is stored locally in `localStorage` (works identically in all three targets)

## Getting started

```bash
npm install
npm run dev          # web dev server at http://localhost:5173
```

## Build & run each target

```bash
# Web (static SPA -> dist/)
npm run build:web

# Browser extension -> dist-extension/
npm run build:extension
#   then: chrome://extensions -> enable Developer mode -> Load unpacked -> select dist-extension/
#   Click the toolbar icon to open the side panel.
npm run zip:extension    # -> release/quillery-extension-v<version>.zip (Web Store upload)

# Desktop (Electron)
npm run electron:dev     # live-reload dev (Vite + Electron)
npm run electron:start   # build once, then launch the desktop window
npm run electron:build   # package an installer into release/ (electron-builder)
```

Other scripts: `npm run typecheck`, `npm run test` (unit tests, Vitest),
`npm run icons` (regenerate PNG app icons).

## Project layout

```
src/
  App.tsx              # app shell, state, all handlers
  main.tsx             # entry + ThemeProvider
  types.ts             # Prompt / Category / domain types
  components/          # feature components (PromptCard, PromptEditor, …)
  components/ui/        # shadcn-style primitives (button, dialog, select, …)
  hooks/               # useLocalStorage, useKeyboardShortcuts, useTheme
  lib/                 # optimizer, export, search, variables, clipboard, defaults
public/
  manifest.json        # MV3 manifest (side panel)
  background.js        # service worker (opens side panel on icon click)
  icons/               # generated PNG icons
electron/
  main.cjs             # Electron main process
  preload.cjs          # hardened preload (contextIsolation on)
scripts/
  make-icons.mjs       # dependency-free PNG icon generator
  post-extension.mjs   # copies dist/ -> dist-extension/
```

## Publishing

See [DISTRIBUTION.md](DISTRIBUTION.md) for step-by-step publishing to the Chrome
Web Store / Edge Add-ons and for building the Windows desktop installer. Listing
copy is in [docs/STORE-LISTING.md](docs/STORE-LISTING.md); the privacy policy is
[PRIVACY.md](PRIVACY.md) (Quillery collects no data).

## What changed in this revision (1.1.0)

This is a clean, maintainable reconstruction of the original (which only existed
as a minified build), plus the requested fixes:

1. **Window sizing** — the UI is responsive instead of a fixed 500×500 box; it
   fills the side panel and centers on wide desktop windows.
2. **Stays open** — the extension uses the **side panel** (not a popup), so it no
   longer closes when you click outside it. The Electron window doesn’t either.
3. **Settings** — the category list grows with the panel (no premature scrollbar
   after 4 items) and the Add/Edit-category dialog scrolls reliably so the emoji,
   color and preview sections are always reachable.
4. **Statistics “By Category”** — resolves the category id to its display name, so
   user-created categories show their name instead of an internal id/code.

## Contributing

Issues and pull requests are welcome. To get set up:

```bash
git clone <your-fork-url>
cd quillery
npm install
npm run dev        # web dev server
npm run test       # run the unit tests
```

## License

[MIT](LICENSE) © Iulian. Free for everyone to use, modify and distribute.

Built with React, Vite, Tailwind CSS, Radix UI (shadcn/ui), lucide-react, Fuse.js
and sonner — all MIT-licensed.
