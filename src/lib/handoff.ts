import { copyToClipboard } from "./clipboard";

// "Open in <AI>" handoff. Opens the prompt in the user's existing, already
// logged-in chat session in a new tab (extension/web) or the system browser
// (Electron, via the main process' window-open handler). No API key, no
// account linking, no host permissions — we only open a URL.
//
// ChatGPT and Claude accept a `?q=` prefill param. Gemini has no public prefill
// param. We ALSO copy the prompt to the clipboard on every handoff as a safety
// net, since the `?q=` prefill isn't guaranteed (Claude's is unofficial) — so
// the prompt is never lost even if a site ignores it.

export type HandoffTargetId = "chatgpt" | "claude" | "gemini";

export interface HandoffTarget {
  id: HandoffTargetId;
  name: string;
  icon: string;
}

export const HANDOFF_TARGETS: HandoffTarget[] = [
  { id: "chatgpt", name: "ChatGPT", icon: "🤖" },
  { id: "claude", name: "Claude", icon: "🧠" },
  { id: "gemini", name: "Gemini", icon: "💎" },
];

export interface HandoffResult {
  /** "prefilled" = the URL carries the prompt; "clipboard" = paste it yourself. */
  mode: "prefilled" | "clipboard";
  /** Whether the clipboard copy succeeded (the safety-net / paste source). */
  copied: boolean;
}

// Keep `?q=` URLs short enough that the chat services reliably accept them;
// longer prompts rely on the clipboard copy instead of prefill.
const MAX_PREFILL = 2000;

export async function openInChat(
  target: HandoffTargetId,
  text: string,
): Promise<HandoffResult> {
  const trimmed = text.trim();
  const encoded = encodeURIComponent(trimmed);
  const canPrefill = encoded.length <= MAX_PREFILL;

  let url: string;
  let mode: HandoffResult["mode"];
  switch (target) {
    case "chatgpt":
      url = canPrefill ? `https://chatgpt.com/?q=${encoded}` : "https://chatgpt.com/";
      mode = canPrefill ? "prefilled" : "clipboard";
      break;
    case "claude":
      url = canPrefill ? `https://claude.ai/new?q=${encoded}` : "https://claude.ai/new";
      mode = canPrefill ? "prefilled" : "clipboard";
      break;
    case "gemini":
    default:
      url = "https://gemini.google.com/app"; // no prefill param
      mode = "clipboard";
      break;
  }

  // Open the tab FIRST, synchronously, while the click's user-activation is
  // still live — otherwise awaiting the clipboard write below would get the
  // popup blocked.
  window.open(url, "_blank", "noopener,noreferrer");

  // Always copy as a safety net (the only delivery for Gemini / long prompts,
  // and a fallback when a site ignores `?q=`).
  const copied = await copyToClipboard(trimmed);
  return { mode, copied };
}
