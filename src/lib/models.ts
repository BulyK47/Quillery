import type { TargetModel } from "@/types";

export interface ModelMeta {
  name: string;
  color: string;
  icon: string;
}

export const MODELS: Record<TargetModel, ModelMeta> = {
  chatgpt: {
    name: "ChatGPT",
    color:
      "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    icon: "🤖",
  },
  claude: {
    name: "Claude",
    color:
      "bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 border-orange-200 dark:border-orange-800",
    icon: "🧠",
  },
  gemini: {
    name: "Gemini",
    color:
      "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    icon: "💎",
  },
  universal: {
    name: "Universal",
    color:
      "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border-purple-200 dark:border-purple-800",
    icon: "✨",
  },
};
