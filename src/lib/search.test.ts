import { describe, it, expect } from "vitest";
import { searchPrompts } from "./search";
import type { Prompt } from "@/types";

const p = (id: string, title: string, content = "", tags?: string[]): Prompt => ({
  id,
  title,
  content,
  category: "writing",
  tags,
  isPinned: false,
  usageCount: 0,
  createdAt: 0,
  updatedAt: 0,
});

const prompts = [
  p("1", "Professional Email", "write an email to a client"),
  p("2", "API Request Helper", "typescript fetch POST bearer token"),
  p("3", "Social Media Post", "linkedin hashtags", ["marketing"]),
];

describe("searchPrompts", () => {
  it("returns all prompts for an empty query", () => {
    expect(searchPrompts(prompts, "")).toHaveLength(3);
    expect(searchPrompts(prompts, "   ")).toHaveLength(3);
  });

  it("finds by title", () => {
    const r = searchPrompts(prompts, "email");
    expect(r[0].id).toBe("1");
  });

  it("finds by content", () => {
    const r = searchPrompts(prompts, "typescript");
    expect(r.some((x) => x.id === "2")).toBe(true);
  });

  it("returns nothing for a clearly-absent term", () => {
    expect(searchPrompts(prompts, "zzzxyq")).toHaveLength(0);
  });
});
