import Fuse from "fuse.js";
import type { Prompt } from "@/types";

// Fuzzy search across the most meaningful prompt fields.
export function searchPrompts(prompts: Prompt[], query: string): Prompt[] {
  if (!query.trim()) return prompts;
  const fuse = new Fuse(prompts, {
    keys: [
      { name: "title", weight: 2 },
      { name: "tags", weight: 1.5 },
      { name: "content", weight: 1 },
    ],
    threshold: 0.4,
    minMatchCharLength: 2,
    includeScore: true,
  });
  return fuse.search(query).map((r) => r.item);
}
