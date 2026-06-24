// Robust clipboard copy with a legacy execCommand fallback for restricted
// contexts (iframes, older WebViews). Returns true on success.
export async function copyToClipboard(text: string): Promise<boolean> {
  const blockedByPolicy =
    window.self !== window.top ||
    (document as Document & { featurePolicy?: { allowsFeature(f: string): boolean } })
      .featurePolicy?.allowsFeature("clipboard-write") === false;

  if (!blockedByPolicy && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* fall through to legacy path */
    }
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    textarea.setAttribute("readonly", "");
    document.body.appendChild(textarea);

    if (/ipad|ipod|iphone/i.test(navigator.userAgent)) {
      const range = document.createRange();
      range.selectNodeContents(textarea);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      textarea.setSelectionRange(0, textarea.value.length);
    } else {
      textarea.select();
    }

    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch (err) {
    console.error("Clipboard copy failed:", err);
    return false;
  }
}
