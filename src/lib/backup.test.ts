import { describe, it, expect } from "vitest";
import {
  buildBackup,
  parseBackup,
  mergeById,
} from "./backup";
import type { Category, Prompt } from "@/types";

const prompt = (over: Partial<Prompt> = {}): Prompt => ({
  id: "1",
  title: "T",
  content: "c",
  category: "writing",
  isPinned: false,
  usageCount: 0,
  createdAt: 1,
  updatedAt: 1,
  ...over,
});
const category = (over: Partial<Category> = {}): Category => ({
  id: "writing",
  name: "Writing",
  emoji: "🟦",
  color: "x",
  ...over,
});

describe("buildBackup", () => {
  it("wraps data with the quillery envelope", () => {
    const b = buildBackup([prompt()], [category()]);
    expect(b.app).toBe("quillery");
    expect(b.version).toBe(1);
    expect(typeof b.exportedAt).toBe("string");
    expect(b.prompts).toHaveLength(1);
    expect(b.categories).toHaveLength(1);
  });
});

describe("parseBackup", () => {
  it("parses a valid versioned backup", () => {
    const text = JSON.stringify(buildBackup([prompt()], [category()]));
    const out = parseBackup(text);
    expect(out?.prompts).toHaveLength(1);
    expect(out?.categories).toHaveLength(1);
  });

  it("accepts the legacy flat shape", () => {
    const text = JSON.stringify({ prompts: [prompt()], categories: [category()] });
    expect(parseBackup(text)?.prompts).toHaveLength(1);
  });

  it("rejects a file tagged as a different app", () => {
    const text = JSON.stringify({ app: "other", prompts: [prompt()] });
    expect(parseBackup(text)).toBeNull();
  });

  it("rejects non-JSON and empty payloads", () => {
    expect(parseBackup("not json {{")).toBeNull();
    expect(parseBackup(JSON.stringify({ prompts: [], categories: [] }))).toBeNull();
  });

  it("normalizes missing fields so a partial file can't crash the UI", () => {
    const text = JSON.stringify({ prompts: [{ id: "x", content: "only required" }] });
    const p = parseBackup(text)?.prompts[0];
    expect(p?.title).toBe("");
    expect(typeof p?.title).toBe("string");
    expect(p?.usageCount).toBe(0);
    expect(Number.isFinite(p?.createdAt)).toBe(true);
    expect(Number.isFinite(p?.updatedAt)).toBe(true);
    expect(p?.isPinned).toBe(false);
  });

  it("drops items with missing/invalid id or content", () => {
    const text = JSON.stringify({
      prompts: [{ id: "" }, { content: "no id" }, { id: "ok", content: "good" }],
    });
    expect(parseBackup(text)?.prompts).toHaveLength(1);
  });

  it("rejects reserved-key ids (prototype pollution guard)", () => {
    const text = JSON.stringify({
      prompts: [{ id: "__proto__", content: "x" }, { id: "ok", content: "y" }],
    });
    const out = parseBackup(text);
    expect(out?.prompts.map((p) => p.id)).toEqual(["ok"]);
  });

  it("coerces a non-finite usageCount to 0", () => {
    const text = JSON.stringify({
      prompts: [{ id: "x", content: "c", usageCount: "lots" }],
    });
    expect(parseBackup(text)?.prompts[0].usageCount).toBe(0);
  });
});

describe("mergeById", () => {
  it("updates same-id entries and appends new ones", () => {
    const current = [prompt({ id: "1", title: "old" }), prompt({ id: "2" })];
    const incoming = [prompt({ id: "1", title: "new" }), prompt({ id: "3" })];
    const merged = mergeById(current, incoming);
    expect(merged).toHaveLength(3);
    expect(merged.find((p) => p.id === "1")?.title).toBe("new");
    expect(merged.map((p) => p.id).sort()).toEqual(["1", "2", "3"]);
  });
});
