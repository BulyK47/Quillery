import { buildBackup, parseBackup, type BackupData } from "./backup";
import type { Category, Prompt } from "@/types";

// External storage backends, layered on top of the app's localStorage state:
//  - Electron desktop: a JSON file in a user-chosen folder (e.g. inside
//    OneDrive/Dropbox) so it syncs across computers.
//  - Browser extension: chrome.storage.local (durable + cross-context).
// The web app has no backend (detectBackend returns null) and is unaffected.

export interface SyncData {
  prompts: Prompt[];
  categories: Category[];
}

export interface SyncBackend {
  kind: "chrome" | "electron";
  /** chrome: always on. electron: only when a sync folder is chosen. */
  enabled(): Promise<boolean>;
  load(): Promise<BackupData | null>;
  save(data: SyncData): Promise<void>;
  subscribe(cb: () => void): () => void;
}

interface ChromeLike {
  storage: {
    local: {
      get(keys: string[], cb: (r: Record<string, unknown>) => void): void;
      set(items: Record<string, unknown>, cb?: () => void): void;
    };
    onChanged: {
      addListener(cb: (changes: Record<string, unknown>, area: string) => void): void;
      removeListener(cb: (changes: Record<string, unknown>, area: string) => void): void;
    };
  };
}

interface DesktopLike {
  isElectron: boolean;
  sync?: {
    getFolder(): Promise<string | null>;
    read(): Promise<string | null>;
    write(text: string): Promise<void>;
    onChange(cb: () => void): () => void;
  };
}

function getChrome(): ChromeLike | null {
  const c = (globalThis as { chrome?: ChromeLike }).chrome;
  return c?.storage?.local ? c : null;
}

function getDesktop(): Required<DesktopLike> | null {
  const d = (globalThis as { desktop?: DesktopLike }).desktop;
  return d?.isElectron && d.sync ? (d as Required<DesktopLike>) : null;
}

export function chromeBackend(chrome: ChromeLike): SyncBackend {
  return {
    kind: "chrome",
    async enabled() {
      return true;
    },
    load() {
      return new Promise((resolve) => {
        chrome.storage.local.get(["prompts", "categories"], (r) => {
          const prompts = Array.isArray(r.prompts) ? (r.prompts as Prompt[]) : [];
          const categories = Array.isArray(r.categories)
            ? (r.categories as Category[])
            : [];
          if (prompts.length === 0 && categories.length === 0) resolve(null);
          else resolve({ prompts, categories });
        });
      });
    },
    save(data) {
      return new Promise((resolve) => {
        chrome.storage.local.set(
          { prompts: data.prompts, categories: data.categories },
          () => resolve(),
        );
      });
    },
    subscribe(cb) {
      const handler = (changes: Record<string, unknown>, area: string) => {
        if (area === "local" && ("prompts" in changes || "categories" in changes)) {
          cb();
        }
      };
      chrome.storage.onChanged.addListener(handler);
      return () => chrome.storage.onChanged.removeListener(handler);
    },
  };
}

export function electronBackend(desktop: Required<DesktopLike>): SyncBackend {
  return {
    kind: "electron",
    async enabled() {
      return !!(await desktop.sync.getFolder());
    },
    async load() {
      const text = await desktop.sync.read();
      if (!text) return null;
      return parseBackup(text); // reuse the validated parser
    },
    async save(data) {
      await desktop.sync.write(
        JSON.stringify(buildBackup(data.prompts, data.categories), null, 2),
      );
    },
    subscribe(cb) {
      return desktop.sync.onChange(cb);
    },
  };
}

export function detectBackend(): SyncBackend | null {
  const desktop = getDesktop();
  if (desktop) return electronBackend(desktop);
  const chrome = getChrome();
  if (chrome) return chromeBackend(chrome);
  return null;
}
