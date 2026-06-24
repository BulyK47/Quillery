import type { Category, Prompt } from "@/types";

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "writing",
    name: "Writing",
    emoji: "🟦",
    color:
      "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
    isDefault: true,
  },
  {
    id: "coding",
    name: "Coding",
    emoji: "🟩",
    color:
      "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400",
    isDefault: true,
  },
  {
    id: "marketing",
    name: "Marketing",
    emoji: "🟨",
    color:
      "bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400",
    isDefault: true,
  },
  {
    id: "experimental",
    name: "Experimental",
    emoji: "🟥",
    color: "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400",
    isDefault: true,
  },
];

// A small, genuinely-useful starter set that also showcases the features:
// different target models, pinned/unpinned, with/without tags, and {{variables}}.
// `now` is injected so the module stays pure / deterministic to import.
export function defaultPrompts(now: number = Date.now()): Prompt[] {
  return [
    {
      id: "welcome-summarize",
      title: "Summarize & extract action items",
      content:
        "Summarize the text below in 3–5 clear bullet points, then list any action items or decisions.\n\n{{text}}",
      category: "writing",
      tags: ["summary", "work"],
      isPinned: true,
      usageCount: 0,
      targetModel: "chatgpt",
      createdAt: now - 3000,
      updatedAt: now - 3000,
    },
    {
      id: "welcome-explain-code",
      title: "Explain this code",
      content:
        "Explain what the following code does, step by step, then point out any bugs or improvements.\n\n{{code}}",
      category: "coding",
      isPinned: false,
      usageCount: 0,
      targetModel: "claude",
      createdAt: now - 2000,
      updatedAt: now - 2000,
    },
    {
      id: "welcome-social-post",
      title: "Catchy social post",
      content:
        "Write a short, engaging social media post about {{topic}}. Friendly tone, one or two emojis, and 3 relevant hashtags.",
      category: "marketing",
      tags: ["social"],
      isPinned: true,
      usageCount: 0,
      targetModel: "gemini",
      createdAt: now - 1000,
      updatedAt: now - 1000,
    },
  ];
}
