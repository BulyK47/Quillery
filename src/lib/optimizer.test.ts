import { describe, it, expect } from "vitest";
import { optimizePrompt, modelTips } from "./optimizer";

describe("optimizePrompt — ChatGPT", () => {
  it("adds role, format and tone to a bare prompt", () => {
    const { content, changes } = optimizePrompt("Write a tweet about cats", "chatgpt");
    expect(content).toContain("You are an expert assistant");
    expect(changes.length).toBeGreaterThanOrEqual(3);
  });

  it("adds step-by-step for analytical prompts", () => {
    const { content } = optimizePrompt("Compare React and Vue", "chatgpt");
    expect(content.toLowerCase()).toContain("step by step");
  });

  it("does NOT add step-by-step when 'explanation' is the only near-match (word boundary)", () => {
    const { content } = optimizePrompt("Write an explanation of closures", "chatgpt");
    expect(content.toLowerCase()).not.toContain("step by step");
  });
});

describe("optimizePrompt — Claude", () => {
  it("wraps a tag-less prompt in <task>", () => {
    const { content } = optimizePrompt("Summarize this article", "claude");
    expect(content).toContain("<task>");
  });

  it("treats a stray '<' as NOT a tag and still wraps", () => {
    const { content } = optimizePrompt("Keep latency < 200ms", "claude");
    expect(content).toContain("<task>");
  });

  it("does not double-wrap when a real tag is present", () => {
    const { content } = optimizePrompt("<note>already structured</note>", "claude");
    expect(content.startsWith("<task>")).toBe(false);
  });
});

describe("optimizePrompt — Gemini", () => {
  it("does not append to a long prompt (no trim-but-grow contradiction)", () => {
    const long = "word ".repeat(200); // > 600 chars
    const { content, explanation } = optimizePrompt(long, "gemini");
    expect(content).toBe(long);
    expect(explanation.join(" ").toLowerCase()).toContain("concise");
  });

  it("prefixes a short prompt with [TASK]", () => {
    const { content } = optimizePrompt("Do the thing", "gemini");
    expect(content.startsWith("[TASK]")).toBe(true);
  });
});

describe("optimizePrompt — universal / tips", () => {
  it("returns guidance without changing content for universal", () => {
    const { content, changes } = optimizePrompt("hi", "universal");
    expect(content).toBe("hi");
    expect(changes).toHaveLength(0);
  });

  it("modelTips returns non-empty lists for real models and [] otherwise", () => {
    expect(modelTips("chatgpt").length).toBeGreaterThan(0);
    expect(modelTips("claude").length).toBeGreaterThan(0);
    expect(modelTips("gemini").length).toBeGreaterThan(0);
    expect(modelTips("universal")).toEqual([]);
  });
});
