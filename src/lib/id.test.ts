import { describe, it, expect } from "vitest";
import { newId } from "./id";

describe("newId", () => {
  it("returns a non-empty string", () => {
    expect(typeof newId()).toBe("string");
    expect(newId().length).toBeGreaterThan(0);
  });

  it("produces unique ids across many rapid calls", () => {
    const ids = new Set(Array.from({ length: 5000 }, () => newId()));
    expect(ids.size).toBe(5000);
  });
});
