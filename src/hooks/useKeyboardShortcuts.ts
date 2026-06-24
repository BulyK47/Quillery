import { useEffect } from "react";

interface Options {
  onNewPrompt?: () => void;
  /** index is 0-based (Ctrl+1 -> 0 … Ctrl+9 -> 8). */
  onQuickCopy?: (index: number) => void;
}

export function useKeyboardShortcuts({ onNewPrompt, onQuickCopy }: Options) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't hijack keys while the user is typing in a field.
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.isContentEditable ||
          /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))
      ) {
        return;
      }
      // Ctrl/Cmd + Shift + P -> new prompt
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        onNewPrompt?.();
        return;
      }
      // Ctrl/Cmd + 1..9 -> quick copy pinned prompt
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= 9) {
          e.preventDefault();
          onQuickCopy?.(n - 1);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onNewPrompt, onQuickCopy]);
}
