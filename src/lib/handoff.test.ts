import { describe, it, expect, vi, beforeEach } from "vitest";

const order: string[] = [];
// Mock the clipboard so we can observe call order and force success/failure.
vi.mock("./clipboard", () => ({
  copyToClipboard: vi.fn(async () => {
    order.push("copy");
    return true;
  }),
}));

import { openInChat } from "./handoff";
import { copyToClipboard } from "./clipboard";

describe("openInChat", () => {
  let opened: string[];
  beforeEach(() => {
    order.length = 0;
    opened = [];
    vi.spyOn(window, "open").mockImplementation((url) => {
      order.push("open");
      opened.push(String(url));
      return null;
    });
    (copyToClipboard as unknown as ReturnType<typeof vi.fn>).mockClear();
  });

  it("builds a ChatGPT prefill URL for a short prompt", async () => {
    const res = await openInChat("chatgpt", "hello world");
    expect(opened[0]).toBe("https://chatgpt.com/?q=hello%20world");
    expect(res.mode).toBe("prefilled");
    expect(res.copied).toBe(true);
  });

  it("builds a Claude prefill URL", async () => {
    await openInChat("claude", "hi");
    expect(opened[0]).toBe("https://claude.ai/new?q=hi");
  });

  it("uses Gemini app URL in clipboard mode", async () => {
    const res = await openInChat("gemini", "hi");
    expect(opened[0]).toBe("https://gemini.google.com/app");
    expect(res.mode).toBe("clipboard");
  });

  it("opens the tab BEFORE awaiting the clipboard (so it isn't popup-blocked)", async () => {
    await openInChat("gemini", "hi");
    expect(order[0]).toBe("open");
    expect(order).toContain("copy");
  });

  it("falls back to a bare URL (clipboard mode) for a very long prompt", async () => {
    const long = "x".repeat(5000);
    const res = await openInChat("chatgpt", long);
    expect(opened[0]).toBe("https://chatgpt.com/");
    expect(res.mode).toBe("clipboard");
  });

  it("reports copied:false when the clipboard write fails", async () => {
    (copyToClipboard as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false);
    const res = await openInChat("gemini", "hi");
    expect(res.copied).toBe(false);
  });
});
