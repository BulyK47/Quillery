import { useState, useCallback } from "react";

type SetValue<T> = (value: T | ((prev: T) => T)) => void;

// Persisting state hook backed by localStorage. Works identically in the web
// app, the extension side panel and the Electron renderer (all expose
// localStorage), so storage stays consistent across every target.
export function useLocalStorage<T>(key: string, initialValue: T): [T, SetValue<T>] {
  const [stored, setStored] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return initialValue;
      const parsed = JSON.parse(raw) as T;
      // Self-heal from corrupt storage: if we expect an array (prompts /
      // categories) but got something else, fall back to the default instead
      // of crashing every render. The error boundary can't fix bad storage,
      // but this can.
      if (Array.isArray(initialValue) && !Array.isArray(parsed)) {
        console.warn(`localStorage key "${key}" was malformed — using defaults.`);
        return initialValue;
      }
      return parsed;
    } catch (err) {
      console.error(`Error reading localStorage key "${key}":`, err);
      return initialValue;
    }
  });

  const setValue = useCallback<SetValue<T>>(
    (value) => {
      setStored((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch (err) {
          console.error(`Error setting localStorage key "${key}":`, err);
        }
        return next;
      });
    },
    [key],
  );

  return [stored, setValue];
}
