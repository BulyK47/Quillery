import type { Category, Prompt } from "@/types";

const DAY = 86_400_000;

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

// `now` is injected so the module stays pure / deterministic to import.
export function defaultPrompts(now: number = Date.now()): Prompt[] {
  return [
    {
      id: "1",
      title: "Professional Email",
      content:
        "Write a professional email to a client to present a new feature of our product. Friendly but professional tone.",
      category: "writing",
      isPinned: true,
      usageCount: 15,
      createdAt: now - DAY * 7,
      updatedAt: now - DAY * 7,
    },
    {
      id: "2",
      title: "API Request Helper",
      content:
        "Create an example of an API request in TypeScript using fetch to make a POST request with Bearer token authentication.",
      category: "coding",
      isPinned: true,
      usageCount: 23,
      targetModel: "chatgpt",
      createdAt: now - DAY * 5,
      updatedAt: now - DAY * 5,
    },
    {
      id: "3",
      title: "Social Media Post",
      content:
        "Generate a LinkedIn post about the importance of continuous learning in technology. Include 3-5 relevant hashtags.",
      category: "marketing",
      isPinned: false,
      usageCount: 8,
      createdAt: now - DAY * 3,
      updatedAt: now - DAY * 3,
    },
    {
      id: "4",
      title: "Debug Assistant",
      content:
        "Help me debug the following error: [describe error here]. Explain possible causes and suggest step-by-step solutions.",
      category: "coding",
      isPinned: false,
      usageCount: 12,
      targetModel: "claude",
      createdAt: now - DAY * 2,
      updatedAt: now - DAY * 2,
    },
    {
      id: "5",
      title: "Personalized Email with Variables",
      content:
        "Hi {{name}},\n\nI'm writing to you about the {{project}} project. I noticed you're interested in {{topic}}.\n\nI'd like to discuss this on {{date}}.\n\nBest regards,\n{{signature}}",
      category: "writing",
      isPinned: true,
      usageCount: 5,
      createdAt: now - DAY,
      updatedAt: now - DAY,
    },
    {
      id: "6",
      title: "Code Review Template",
      content:
        "Analyze the following code and provide constructive feedback: [code]. Focus on: performance, security, best practices, and readability.",
      category: "coding",
      isPinned: false,
      usageCount: 7,
      createdAt: now - DAY * 4,
      updatedAt: now - DAY * 4,
    },
    {
      id: "7",
      title: "SEO Meta Description",
      content:
        "Create an SEO-optimized meta description (max 160 characters) for the article: [article title]. Include relevant keywords and a compelling CTA.",
      category: "marketing",
      isPinned: false,
      usageCount: 3,
      targetModel: "gemini",
      createdAt: now - DAY * 6,
      updatedAt: now - DAY * 6,
    },
    {
      id: "8",
      title: "Test Case Generator",
      content:
        "Generate test cases for the function: [function name]. Include: happy path, edge cases, error handling, and boundary conditions.",
      category: "coding",
      isPinned: true,
      usageCount: 18,
      createdAt: now - DAY * 8,
      updatedAt: now - DAY * 8,
    },
    {
      id: "9",
      title: "Brainstorming Session",
      content:
        "Help me generate 10 creative ideas for [topic/problem]. For each idea, provide: brief description, advantages, and possible challenges.",
      category: "experimental",
      isPinned: false,
      usageCount: 2,
      createdAt: now - DAY * 9,
      updatedAt: now - DAY * 9,
    },
    {
      id: "10",
      title: "Newsletter Content",
      content:
        "Write content for the weekly newsletter about [topic]. Conversational tone, 3 main sections, and a clear CTA at the end.",
      category: "marketing",
      isPinned: false,
      usageCount: 11,
      createdAt: now - DAY * 10,
      updatedAt: now - DAY * 10,
    },
  ];
}
