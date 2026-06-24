import { useEffect, useMemo, useRef } from "react";
import { detectBackend, type SyncBackend } from "@/lib/syncBackend";
import type { Category, Prompt } from "@/types";

interface Args {
  prompts: Prompt[];
  categories: Category[];
  setPrompts: (p: Prompt[]) => void;
  setCategories: (c: Category[]) => void;
  /** Bump to re-pull (e.g. after a sync folder is chosen). */
  refreshKey?: number;
  /** Reports the detected backend kind (or null on web). */
  onBackend?: (kind: SyncBackend["kind"] | null) => void;
}

const ser = (p: Prompt[], c: Category[]) => JSON.stringify({ prompts: p, categories: c });

// Mirrors app state to an external backend (Electron file / chrome.storage) and
// pulls external changes back in. No-op on the web (no backend).
export function useExternalStore({
  prompts,
  categories,
  setPrompts,
  setCategories,
  refreshKey = 0,
  onBackend,
}: Args) {
  const backend = useMemo(detectBackend, []);
  // Latest state for the debounced writer (avoids stale-closure writes).
  const stateRef = useRef({ prompts, categories });
  stateRef.current = { prompts, categories };

  useEffect(() => {
    onBackend?.(backend?.kind ?? null);
  }, [backend, onBackend]);

  // Pull: load on mount / refresh / external change.
  useEffect(() => {
    if (!backend) return;
    let active = true;
    const pull = async () => {
      try {
        if (!(await backend.enabled())) return;
        const data = await backend.load();
        if (!active || !data) return;
        const cur = stateRef.current;
        // Apply only changed sections (skip identical content to avoid echo).
        if (ser(data.prompts, []) !== ser(cur.prompts, [])) setPrompts(data.prompts);
        if (ser([], data.categories) !== ser([], cur.categories)) {
          setCategories(data.categories);
        }
      } catch (e) {
        console.error("sync pull failed:", e);
      }
    };
    void pull();
    const unsub = backend.subscribe(pull);
    return () => {
      active = false;
      unsub();
    };
  }, [backend, refreshKey, setPrompts, setCategories]);

  // Push: write on change (debounced, read-before-write to avoid loops).
  useEffect(() => {
    if (!backend) return;
    let cancelled = false;
    const handle = setTimeout(async () => {
      try {
        if (!(await backend.enabled())) return;
        const current = await backend.load();
        const next = stateRef.current;
        const currentSer = current
          ? ser(current.prompts, current.categories)
          : null;
        const nextSer = ser(next.prompts, next.categories);
        if (cancelled || currentSer === nextSer) return;
        await backend.save(next);
      } catch (e) {
        console.error("sync push failed:", e);
      }
    }, 700);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [prompts, categories, backend]);
}
