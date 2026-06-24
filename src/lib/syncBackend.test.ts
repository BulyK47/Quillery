import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { detectBackend } from "./syncBackend";
import type { Category, Prompt } from "@/types";

const prompt: Prompt = {
  id: "1",
  title: "T",
  content: "c",
  category: "writing",
  isPinned: false,
  usageCount: 0,
  createdAt: 0,
  updatedAt: 0,
};
const category: Category = { id: "writing", name: "Writing", emoji: "🟦", color: "x" };

function fakeChrome() {
  const store: Record<string, unknown> = {};
  const listeners: Array<(c: Record<string, unknown>, a: string) => void> = [];
  return {
    store,
    listeners,
    api: {
      storage: {
        local: {
          get: (keys: string[], cb: (r: Record<string, unknown>) => void) =>
            cb(Object.fromEntries(keys.map((k) => [k, store[k]]))),
          set: (items: Record<string, unknown>, cb?: () => void) => {
            Object.assign(store, items);
            listeners.forEach((l) => l({ prompts: {} }, "local"));
            cb?.();
          },
        },
        onChanged: {
          addListener: (cb: (c: Record<string, unknown>, a: string) => void) =>
            listeners.push(cb),
          removeListener: (cb: (c: Record<string, unknown>, a: string) => void) => {
            const i = listeners.indexOf(cb);
            if (i >= 0) listeners.splice(i, 1);
          },
        },
      },
    },
  };
}

describe("detectBackend (chrome.storage)", () => {
  let fake: ReturnType<typeof fakeChrome>;
  beforeEach(() => {
    fake = fakeChrome();
    (globalThis as { chrome?: unknown }).chrome = fake.api;
  });
  afterEach(() => {
    delete (globalThis as { chrome?: unknown }).chrome;
  });

  it("detects the chrome backend", () => {
    expect(detectBackend()?.kind).toBe("chrome");
  });

  it("load returns null when empty, then round-trips saved data", async () => {
    const b = detectBackend()!;
    expect(await b.load()).toBeNull();
    await b.save({ prompts: [prompt], categories: [category] });
    const out = await b.load();
    expect(out?.prompts).toHaveLength(1);
    expect(out?.categories[0].name).toBe("Writing");
  });

  it("notifies subscribers when prompts change", async () => {
    const b = detectBackend()!;
    let fired = 0;
    const unsub = b.subscribe(() => (fired += 1));
    await b.save({ prompts: [prompt], categories: [] });
    expect(fired).toBeGreaterThan(0);
    unsub();
  });

  it("returns null backend when no chrome/desktop is present", () => {
    delete (globalThis as { chrome?: unknown }).chrome;
    expect(detectBackend()).toBeNull();
  });
});
