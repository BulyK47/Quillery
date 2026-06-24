import { Coins, FileText, Hash, Repeat } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Category, Prompt } from "@/types";

interface StatisticsProps {
  prompts: Prompt[];
  categories: Category[];
}

export function Statistics({ prompts, categories }: StatisticsProps) {
  const total = prompts.length;
  const totalChars = prompts.reduce((sum, p) => sum + p.content.length, 0);
  const estimatedTokens = Math.ceil(totalChars / 4);
  const totalUses = prompts.reduce((sum, p) => sum + p.usageCount, 0);

  const stats = [
    {
      label: "Total Prompts",
      value: total,
      icon: FileText,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10 dark:bg-blue-500/20",
    },
    {
      label: "Total Characters",
      value: totalChars.toLocaleString(),
      icon: Hash,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-500/10 dark:bg-green-500/20",
    },
    {
      label: "Estimated Tokens",
      value: estimatedTokens.toLocaleString(),
      icon: Coins,
      color: "text-yellow-600 dark:text-yellow-400",
      bg: "bg-yellow-500/10 dark:bg-yellow-500/20",
    },
    {
      label: "Total Uses",
      value: totalUses.toLocaleString(),
      icon: Repeat,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-500/10 dark:bg-purple-500/20",
    },
  ];

  // Fix: resolve the category id to its display name + emoji so user-created
  // categories show their name instead of the internal id ("cat_169…").
  const byId = new Map(categories.map((c) => [c.id, c]));
  const counts = prompts.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});
  const categoryBreakdown = Object.entries(counts)
    .map(([id, count]) => {
      const cat = byId.get(id);
      return {
        id,
        count,
        emoji: cat?.emoji ?? "⬜",
        // Deleted/orphaned category: never surface the raw id ("cat_169…").
        name: cat?.name ?? "Uncategorized",
      };
    })
    .sort((a, b) => b.count - a.count);

  const mostUsed = prompts
    .filter((p) => p.usageCount > 0)
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 5);

  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="text-2xl font-bold mb-1">Statistics</h2>
        <p className="text-sm text-muted-foreground">Overview of your prompts</p>
      </div>

      <div className="grid gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${s.bg}`}>
                <s.icon className={`size-5 ${s.color}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {total > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">By Category</h3>
          <div className="space-y-2">
            {categoryBreakdown.map((c) => (
              <div key={c.id} className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-1.5">
                  <span>{c.emoji}</span>
                  <span>{c.name}</span>
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(c.count / total) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">
                    {c.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {totalUses > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Most Used</h3>
          <div className="space-y-2">
            {mostUsed.map((p) => (
              <div key={p.id} className="flex items-start justify-between gap-2">
                <p className="text-sm line-clamp-1 flex-1">
                  {p.title || p.content}
                </p>
                <span className="text-sm font-medium text-muted-foreground">
                  {p.usageCount}x
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
