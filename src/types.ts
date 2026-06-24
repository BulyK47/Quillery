export type TargetModel = "chatgpt" | "claude" | "gemini" | "universal";

export interface ModelOptimization {
  model: TargetModel;
  content: string;
  explanation: string[];
  changes: OptimizationChange[];
  timestamp: number;
}

export interface OptimizationChange {
  type: "added" | "modified" | "removed";
  description: string;
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
  category: string;
  tags?: string[];
  isPinned: boolean;
  usageCount: number;
  rating?: number;
  targetModel?: TargetModel;
  modelOptimizations?: ModelOptimization[];
  lastUsed?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
  isDefault?: boolean;
}

export type SortOption =
  | "pinned"
  | "usage"
  | "rating"
  | "recent"
  | "alphabetical";

export interface OptimizationResult {
  content: string;
  explanation: string[];
  changes: OptimizationChange[];
}
