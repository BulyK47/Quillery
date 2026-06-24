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
  /** Surfaced when a sync write fails (e.g. folder offline). */
  onError?: (message: string) => void;
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
  onError,
}: Args) {
  const backend = useMemo(detectBackend, []);
  // Latest state for the debounced writer (avoids stale-closure writes).
  const stateRef = useRef({ prompts, categories });
  stateRef.current = { prompts, categories };
  // The push must not run until the pull for the current refreshKey has loaded
  // the remote — otherwise it could overwrite the folder's authoritative copy
  // with this device's pre-pull data (a cross-device wipe).
  const hydratedKey = useRef<number | null>(null);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    onBackend?.(backend?.kind ?? null);
  }, [backend, onBackend]);

  // Pull: load on mount / refresh / external change.
  useEffect(() => {
    if (!backend) return;
    let active = true;
    hydratedKey.current = null;
    const pull = async (initial: boolean) => {
      try {
        if (!(await backend.enabled())) {
          if (initial && active) hydratedKey.current = refreshKey;
          return;
        }
        const data = await backend.load();
        if (!active) return;
        if (data) {
          const cur = stateRef.current;
          // Only replace a section the remote actually provides — never wipe a
          // populated local section with an empty remote one.
          if (data.prompts.length > 0 && ser(data.prompts, []) !== ser(cur.prompts, [])) {
            setPrompts(data.prompts);
          }
          if (
            data.categories.length > 0 &&
            ser([], data.categories) !== ser([], cur.categories)
          ) {
            setCategories(data.categories);
          }
        }
        if (initial) hydratedKey.current = refreshKey;
      } catch (e) {
        console.error("sync pull failed:", e);
        if (initial && active) hydratedKey.current = refreshKey;
      }
    };
    void pull(true);
    const unsub = backend.subscribe(() => pull(false));
    return () => {
      active = false;
      unsub();
    };
  }, [backend, refreshKey, setPrompts, setCategories]);

  // Push: write on change (debounced, read-before-write, after hydration).
  useEffect(() => {
    if (!backend) return;
    let cancelled = false;
    const handle = setTimeout(async () => {
      try {
        // Don't write until the pull triggered by this refreshKey has finished.
        if (hydratedKey.current !== refreshKey) return;
        if (!(await backend.enabled())) return;
        const current = await backend.load();
        const next = stateRef.current;
        const currentSer = current ? ser(current.prompts, current.categories) : null;
        const nextSer = ser(next.prompts, next.categories);
        if (cancelled || currentSer === nextSer) return;
        await backend.save(next);
      } catch (e) {
        console.error("sync push failed:", e);
        onErrorRef.current?.("Couldn't save to the sync folder — check it's available.");
      }
    }, 700);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [prompts, categories, backend, refreshKey]);
}
