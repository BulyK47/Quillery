# Quillery — Privacy Policy

_Last updated: 24 June 2026_

Quillery is built to be private by default. **It does not collect, transmit, or
sell any of your data.**

## What data Quillery handles

- **Your prompts, categories, tags, ratings and settings** are stored **locally
  on your device** — `localStorage` (web), `chrome.storage.local` (extension),
  or a JSON file in a folder you choose (desktop "Sync folder"). They never
  leave your machine, and Quillery never sends them anywhere.
- **Sync folder (desktop, optional):** if you pick a folder, Quillery writes a
  `quillery-data.json` file there. If that folder happens to be inside a cloud
  drive you control (OneDrive, Dropbox, …), that service syncs the file for you
  under your own account — Quillery is not involved in the transfer.
- Quillery has **no account system, no login, and no server**. There is nothing
  to sign up for.

## What Quillery does NOT do

- ❌ No analytics, telemetry, or usage tracking.
- ❌ No third-party SDKs, ad networks, or trackers.
- ❌ No background network requests. The "Optimize" feature runs entirely on
  your device using built-in rules — your prompts are never sent to any AI
  provider or API by Quillery.
- ❌ No selling or sharing of data (there is no data to share).

### One thing to know: "Open in ChatGPT / Claude / Gemini"

Quillery has an optional **"Open in…"** action. When *you* choose it, Quillery
opens that provider's website in a new browser tab with your prompt (for
ChatGPT and Claude the prompt is passed in the URL; for Gemini it's copied to
your clipboard to paste). This is a normal page navigation you initiate — the
prompt goes to **your own logged-in session** with that provider, governed by
**their** privacy policy. Quillery has no server and sends nothing in the
background; it never accesses your accounts or reads those pages.

## Permissions

The browser extension requests a single permission:

- **`sidePanel`** — used only to open Quillery's interface in the browser side
  panel when you click its toolbar icon.

It does **not** request access to your browsing history, the content of web
pages, your tabs, or any host permissions.

## Data export & deletion

- **Export:** you can export all your data at any time as JSON or Markdown from
  the in-app menu.
- **Deletion:** because everything is stored locally, removing the extension /
  uninstalling the desktop app — or clearing the browser's site data for the
  extension — permanently deletes all Quillery data. There are no server-side
  copies.

## Contact

For questions about this policy, contact: **voicila.iuliant@gmail.com**

## Changes

If this policy changes, the "Last updated" date above will be revised and the
new version will ship with the next release.
