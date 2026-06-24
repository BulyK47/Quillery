import { Badge } from "@/components/ui/badge";
import { MODELS } from "@/lib/models";
import { cn } from "@/lib/utils";
import type { TargetModel } from "@/types";

export function ModelBadge({
  model,
  size = "sm",
}: {
  model: TargetModel;
  size?: "sm" | "md";
}) {
  const meta = MODELS[model];
  if (!meta) return null;
  return (
    <Badge
      variant="outline"
      className={cn(meta.color, size === "sm" ? "text-xs" : "text-sm", "gap-1")}
    >
      <span>{meta.icon}</span>
      <span>{meta.name}</span>
    </Badge>
  );
}
