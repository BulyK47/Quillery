import type { Category, Prompt, TargetModel } from "@/types";

// A Quillery backup is a single, portable JSON file: export it on one machine,
// import it on another. Versioned + tagged so future imports can validate and
// migrate; import also accepts the older flat { prompts, categories } shape.

const BACKUP_VERSION = 1;
const RESERVED_IDS = new Set(["__proto__", "constructor", "prototype"]);
const VALID_MODELS = new Set<TargetModel>([
  "chatgpt",
  "claude",
  "gemini",
  "universal",
]);

export interface QuilleryBackup {
  app: "quillery";
  version: number;
  exportedAt: string;
  prompts: Prompt[];
  categories: Category[];
}

export interface BackupData {
  prompts: Prompt[];
  categories: Category[];
}

export function buildBackup(
  prompts: Prompt[],
  categories: Category[],
): QuilleryBackup {
  return {
    app: "quillery",
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    prompts,
    categories,
  };
}

export function exportBackup(prompts: Prompt[], categories: Category[]): void {
  const json = JSON.stringify(buildBackup(prompts, categories), null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `quillery-backup-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---- validation / normalization ------------------------------------------
function finite(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function validId(v: unknown): v is string {
  return typeof v === "string" && v.length > 0 && !RESERVED_IDS.has(v);
}

function normalizePrompt(raw: unknown): Prompt | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (!validId(r.id) || typeof r.content !== "string") return null;
  const now = Date.now();
  const tags = Array.isArray(r.tags)
    ? r.tags.filter((t): t is string => typeof t === "string")
    : undefined;
  const targetModel = VALID_MODELS.has(r.targetModel as TargetModel)
    ? (r.targetModel as TargetModel)
    : undefined;
  return {
    id: r.id,
    title: str(r.title),
    content: r.content,
    category: str(r.category, "other"),
    tags: tags && tags.length > 0 ? tags : undefined,
    isPinned: r.isPinned === true,
    usageCount: Math.max(0, Math.floor(finite(r.usageCount, 0))),
    rating:
      typeof r.rating === "number" && Number.isFinite(r.rating)
        ? r.rating
        : undefined,
    targetModel,
    lastUsed:
      typeof r.lastUsed === "number" && Number.isFinite(r.lastUsed)
        ? r.lastUsed
        : undefined,
    createdAt: finite(r.createdAt, now),
    updatedAt: finite(r.updatedAt, now),
  };
}

function normalizeCategory(raw: unknown): Category | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (!validId(r.id) || typeof r.name !== "string" || r.name.length === 0) {
    return null;
  }
  return {
    id: r.id,
    name: r.name,
    emoji: str(r.emoji, "📋"),
    color: str(
      r.color,
      "bg-gray-500/10 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400",
    ),
    ...(r.isDefault === true ? { isDefault: true } : {}),
  };
}

/**
 * Parses + validates a backup file's text. Accepts the versioned wrapper or a
 * legacy flat `{ prompts, categories }`. Every item is normalized (missing
 * fields get safe defaults) so a hand-edited or partial file can't crash the
 * UI. Returns null if it isn't a usable Quillery export.
 */
export function parseBackup(text: string): BackupData | null {
  let obj: unknown;
  try {
    obj = JSON.parse(text);
  } catch {
    return null;
  }
  if (!obj || typeof obj !== "object") return null;
  const record = obj as Record<string, unknown>;

  // If the file is tagged, it must be a Quillery backup.
  if (typeof record.app === "string" && record.app !== "quillery") return null;

  const rawPrompts = Array.isArray(record.prompts) ? record.prompts : [];
  const rawCategories = Array.isArray(record.categories) ? record.categories : [];

  const prompts = rawPrompts
    .map(normalizePrompt)
    .filter((p): p is Prompt => p !== null);
  const categories = rawCategories
    .map(normalizeCategory)
    .filter((c): c is Category => c !== null);

  if (prompts.length === 0 && categories.length === 0) return null;
  return { prompts, categories };
}

/** Combines two id-keyed lists; incoming entries overwrite same-id ones. */
export function mergeById<T extends { id: string }>(
  current: T[],
  incoming: T[],
): T[] {
  const map = new Map(current.map((x) => [x.id, x]));
  for (const x of incoming) map.set(x.id, x);
  return [...map.values()];
}
