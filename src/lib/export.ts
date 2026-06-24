import type { Category, Prompt } from "@/types";

/** Builds a Markdown document grouping prompts by category. */
export function buildMarkdown(prompts: Prompt[], categories: Category[]): string {
  const exportedAt = new Date().toLocaleString("ro-RO");
  let md = `# Quillery Export\n\n`;
  md += `**Exportat:** ${exportedAt}\n\n`;
  md += `**Total Prompt-uri:** ${prompts.length}\n\n`;
  md += `---\n\n`;

  const byId = categories.reduce<Record<string, Category>>((acc, c) => {
    acc[c.id] = c;
    return acc;
  }, {});

  const grouped = prompts.reduce<Record<string, Prompt[]>>((acc, p) => {
    const key = p.category || "other";
    (acc[key] ||= []).push(p);
    return acc;
  }, {});

  for (const [categoryId, items] of Object.entries(grouped)) {
    const cat = byId[categoryId] ?? { name: "Other", emoji: "📋" };
    md += `## ${cat.emoji} ${cat.name}\n\n`;
    for (const p of items) {
      md += `### ${p.title || "Untitled"}\n\n`;
      const meta: string[] = [];
      if (p.isPinned) meta.push("📌 Blocat");
      if (p.rating) meta.push(`⭐ ${p.rating}/5`);
      if (p.usageCount > 0) meta.push(`🔢 ${p.usageCount} folosiri`);
      if (p.tags && p.tags.length > 0) meta.push(`🏷️ ${p.tags.join(", ")}`);
      if (meta.length > 0) md += `*${meta.join(" • ")}*\n\n`;
      md += "```\n" + p.content + "\n```\n\n";
      md += `---\n\n`;
    }
  }
  return md;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

export function exportMarkdown(prompts: Prompt[], categories: Category[]): void {
  const blob = new Blob([buildMarkdown(prompts, categories)], {
    type: "text/markdown",
  });
  triggerDownload(blob, `quillery-prompts-${today()}.md`);
}
