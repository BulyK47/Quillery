import { describe, it, expect } from "vitest";
import { defaultPrompts, DEFAULT_CATEGORIES } from "./defaults";

describe("defaultPrompts", () => {
  const prompts = defaultPrompts(1_000_000);

  it("ships a small, useful starter set", () => {
    expect(prompts).toHaveLength(3);
    // genuinely usable: each has a variable to fill in
    expect(prompts.every((p) => /\{\{[^}]+\}\}/.test(p.content))).toBe(true);
    // fresh: no fake usage counts
    expect(prompts.every((p) => p.usageCount === 0)).toBe(true);
  });

  it("showcases variety (models, pin, tags)", () => {
    const models = new Set(prompts.map((p) => p.targetModel));
    expect(models).toEqual(new Set(["chatgpt", "claude", "gemini"]));
    expect(prompts.some((p) => p.isPinned)).toBe(true);
    expect(prompts.some((p) => !p.isPinned)).toBe(true);
    expect(prompts.some((p) => p.tags && p.tags.length > 0)).toBe(true);
    expect(prompts.some((p) => !p.tags)).toBe(true);
  });

  it("references only real default categories", () => {
    const ids = new Set(DEFAULT_CATEGORIES.map((c) => c.id));
    expect(prompts.every((p) => ids.has(p.category))).toBe(true);
  });
});
