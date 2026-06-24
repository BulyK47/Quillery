import { describe, it, expect } from "vitest";
import {
  extractVariables,
  hasVariables,
  replaceVariables,
} from "./variables";

describe("extractVariables", () => {
  it("returns unique, trimmed variable names", () => {
    expect(extractVariables("Hi {{name}}, about {{ project }} and {{name}}")).toEqual([
      "name",
      "project",
    ]);
  });

  it("returns [] when there are no variables", () => {
    expect(extractVariables("no variables here")).toEqual([]);
  });
});

describe("hasVariables", () => {
  it("detects presence of a variable", () => {
    expect(hasVariables("a {{b}} c")).toBe(true);
    expect(hasVariables("plain text")).toBe(false);
  });
});

describe("replaceVariables", () => {
  it("replaces with and without inner whitespace", () => {
    expect(replaceVariables("Hi {{name}} and {{ name }}", { name: "Bob" })).toBe(
      "Hi Bob and Bob",
    );
  });

  it("inserts $-containing values verbatim (no replacement-pattern expansion)", () => {
    expect(replaceVariables("Cost {{c}}", { c: "$5 for $& and $1" })).toBe(
      "Cost $5 for $& and $1",
    );
  });

  it("does not crash on regex-special variable names", () => {
    expect(() => replaceVariables("x", { "a[b": "v" })).not.toThrow();
  });

  it("leaves unknown placeholders untouched", () => {
    expect(replaceVariables("{{a}} {{b}}", { a: "1" })).toBe("1 {{b}}");
  });
});
