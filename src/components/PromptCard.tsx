import { useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Files,
  MoreVertical,
  Pencil,
  Pin,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StarRating } from "@/components/StarRating";
import { ModelBadge } from "@/components/ModelBadge";
import { copyToClipboard } from "@/lib/clipboard";
import { hasVariables } from "@/lib/variables";
import { HANDOFF_TARGETS, openInChat, type HandoffTargetId } from "@/lib/handoff";
import { cn } from "@/lib/utils";
import type { Category, Prompt } from "@/types";

interface PromptCardProps {
  prompt: Prompt;
  categories: Category[];
  /** Returns true if the prompt was copied now; false/void if deferred (e.g. variables dialog). */
  onCopy: (prompt: Prompt) => void | boolean | Promise<void | boolean>;
  onEdit: (prompt: Prompt) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onOptimize?: (prompt: Prompt) => void;
  onDuplicate?: (prompt: Prompt) => void;
  onRate?: (prompt: Prompt) => void;
  layout?: "vertical" | "list";
}

export function PromptCard({
  prompt,
  categories,
  onCopy,
  onEdit,
  onDelete,
  onTogglePin,
  onOptimize,
  onDuplicate,
  onRate,
  layout = "vertical",
}: PromptCardProps) {
  const [copied, setCopied] = useState(false);
  const isList = layout === "list";

  const flashCopied = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopy = async () => {
    // Only flash "Copied!" if a copy actually happened — prompts with
    // {{variables}} defer to the fill dialog and don't copy yet.
    const didCopy = await onCopy(prompt);
    if (didCopy) flashCopied();
  };

  const handleCopyWithoutVariables = async () => {
    const stripped = prompt.content.replace(/\{\{[^}]+\}\}/g, "______");
    if (await copyToClipboard(stripped)) {
      toast.success("Copied without variables!");
      flashCopied();
    } else {
      toast.error("Copy failed");
    }
  };

  const handleOpenIn = async (id: HandoffTargetId, name: string) => {
    const { mode, copied } = await openInChat(id, prompt.content);
    if (mode === "clipboard" && !copied) {
      toast.error(`Opening ${name}…`, {
        description: "Couldn't copy the prompt — copy it manually to paste.",
      });
    } else if (mode === "clipboard") {
      toast.success(`Opening ${name}…`, {
        description: "Prompt copied — paste it into the chat",
      });
    } else {
      toast.success(`Opening in ${name}…`);
    }
  };

  const charCount = prompt.content.length;
  const tokenEstimate = Math.ceil(charCount / 4);
  const promptHasVariables = hasVariables(prompt.content);

  const category =
    categories.find((c) => c.id === prompt.category) ?? {
      emoji: "⬜",
      color:
        "bg-gray-500/10 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400",
      // Orphaned (deleted) category: show a friendly label, never the raw id.
      name: "Uncategorized",
    };

  return (
    <Card
      className={cn(
        "group relative transition-all hover:shadow-md",
        prompt.isPinned && "ring-2 ring-primary",
        isList ? "flex items-start gap-4 p-4" : "p-4",
      )}
    >
      {prompt.isPinned && (
        <div className="absolute top-2 right-2">
          <Pin className="size-4 text-primary fill-primary" />
        </div>
      )}

      <div className={cn("flex-1", !isList && "space-y-3")}>
        <div className={cn("flex items-start", isList ? "gap-4 flex-1" : "gap-2")}>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg">{category.emoji}</span>
              <Badge variant="secondary" className={category.color}>
                {category.name}
              </Badge>
              {prompt.targetModel && prompt.targetModel !== "universal" && (
                <ModelBadge model={prompt.targetModel} size="sm" />
              )}
              {prompt.usageCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {prompt.usageCount} {prompt.usageCount === 1 ? "use" : "uses"}
                </span>
              )}
            </div>

            {prompt.title && (
              <h3 className="font-semibold text-lg line-clamp-1">
                {prompt.title}
              </h3>
            )}

            {prompt.rating && prompt.rating > 0 && (
              <div className="flex items-center gap-2">
                <StarRating rating={prompt.rating} readonly size="sm" />
                <span className="text-xs text-muted-foreground">
                  ({prompt.rating}/5)
                </span>
              </div>
            )}

            {prompt.tags && prompt.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {prompt.tags.map((tag, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="text-xs bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border-purple-200 dark:border-purple-800"
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            <p
              className={cn(
                "text-sm text-muted-foreground whitespace-pre-wrap",
                isList ? "line-clamp-2" : "line-clamp-3",
              )}
            >
              {prompt.content}
            </p>

            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <span>{charCount} characters</span>
              <span>•</span>
              <span>~{tokenEstimate} tokens</span>
              {promptHasVariables && (
                <>
                  <span>•</span>
                  <Badge
                    variant="secondary"
                    className="bg-gray-500/10 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400"
                  >
                    Variables
                  </Badge>
                </>
              )}
            </div>
          </div>

          {!isList && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                  aria-label="Prompt actions"
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onTogglePin(prompt.id)}>
                  <Pin className="size-4 mr-2" />
                  {prompt.isPinned ? "Unpin" : "Pin"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(prompt)}>
                  <Pencil className="size-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <ExternalLink className="size-4 mr-2" />
                    Open in
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {HANDOFF_TARGETS.map((t) => (
                      <DropdownMenuItem
                        key={t.id}
                        onClick={() => handleOpenIn(t.id, t.name)}
                      >
                        <span className="mr-2">{t.icon}</span>
                        {t.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                {promptHasVariables && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleCopyWithoutVariables}>
                      <Copy className="size-4 mr-2" />
                      Copy (without variables)
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(prompt.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-4 mr-2" />
                  Delete
                </DropdownMenuItem>
                {onOptimize && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onOptimize(prompt)}>
                      <Sparkles className="size-4 mr-2" />
                      Optimize with AI
                    </DropdownMenuItem>
                  </>
                )}
                {onDuplicate && (
                  <DropdownMenuItem onClick={() => onDuplicate(prompt)}>
                    <Files className="size-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                )}
                {onRate && (
                  <DropdownMenuItem onClick={() => onRate(prompt)}>
                    <Star className="size-4 mr-2" />
                    Rate
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className={cn("flex gap-2", isList && "ml-auto")}>
          <Button onClick={handleCopy} className="flex-1" size={isList ? "default" : "sm"}>
            {copied ? (
              <>
                <Check className="size-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="size-4 mr-2" />
                Copy
              </>
            )}
          </Button>
          {isList && (
            <>
              <Button variant="outline" size="icon" onClick={() => onTogglePin(prompt.id)}>
                <Pin className={cn("size-4", prompt.isPinned && "fill-current")} />
              </Button>
              <Button variant="outline" size="icon" onClick={() => onEdit(prompt)}>
                <Pencil className="size-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => onDelete(prompt.id)}>
                <Trash2 className="size-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
