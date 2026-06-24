import { useState } from "react";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { newId } from "@/lib/id";
import type { Category } from "@/types";

const COLORS = [
  { name: "Blue", value: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400", hex: "#3B82F6" },
  { name: "Sky", value: "bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400", hex: "#0EA5E9" },
  { name: "Cyan", value: "bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400", hex: "#06B6D4" },
  { name: "Teal", value: "bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400", hex: "#14B8A6" },
  { name: "Indigo", value: "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400", hex: "#6366F1" },
  { name: "Green", value: "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400", hex: "#10B981" },
  { name: "Emerald", value: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400", hex: "#10B981" },
  { name: "Lime", value: "bg-lime-500/10 text-lime-600 dark:bg-lime-500/20 dark:text-lime-400", hex: "#84CC16" },
  { name: "Yellow", value: "bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400", hex: "#F59E0B" },
  { name: "Amber", value: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400", hex: "#F59E0B" },
  { name: "Orange", value: "bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400", hex: "#F97316" },
  { name: "Red", value: "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400", hex: "#EF4444" },
  { name: "Rose", value: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400", hex: "#F43F5E" },
  { name: "Pink", value: "bg-pink-500/10 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400", hex: "#EC4899" },
  { name: "Fuchsia", value: "bg-fuchsia-500/10 text-fuchsia-600 dark:bg-fuchsia-500/20 dark:text-fuchsia-400", hex: "#D946EF" },
  { name: "Purple", value: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400", hex: "#A855F7" },
  { name: "Violet", value: "bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400", hex: "#8B5CF6" },
  { name: "Gray", value: "bg-gray-500/10 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400", hex: "#6B7280" },
  { name: "Slate", value: "bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400", hex: "#64748B" },
];

const EMOJIS = ["🟦", "🟩", "🟨", "🟥", "🟪", "🟧", "⭐", "🔷", "🔶", "💎", "🎨", "📝", "💡", "🚀", "⚡", "🔥", "✨", "🎯", "📊", "🔧", "💻", "📱", "🌟", "🎭"];

const NAME_SUGGESTIONS = ["Writing", "Coding", "Marketing", "Experimental", "SEO", "Social Media", "Email", "Blog Posts", "Documentation", "Bug Fixes", "Code Review", "Testing", "Sales", "Customer Support", "Research", "Brainstorming", "Copywriting", "Content Creation", "Video Scripts", "Podcasts", "Design", "UI/UX", "Product", "Analytics"];

interface CategoryManagerProps {
  categories: Category[];
  onSave: (categories: Category[]) => void;
}

interface Draft {
  name: string;
  color: string;
  emoji: string;
}

const emptyDraft = (): Draft => ({ name: "", color: COLORS[0].value, emoji: "🟦" });

export function CategoryManager({ categories, onSave }: CategoryManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const startAdd = () => {
    setEditingId(null);
    setDraft(emptyDraft());
    setDialogOpen(true);
  };

  const startEdit = (id: string) => {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;
    setEditingId(id);
    setDraft({ name: cat.name, color: cat.color, emoji: cat.emoji });
    setDialogOpen(true);
  };

  const handleAdd = () => {
    const created: Category = {
      id: newId(),
      name: draft.name.trim(),
      color: draft.color,
      emoji: draft.emoji,
    };
    onSave([...categories, created]);
    setDraft(emptyDraft());
    setDialogOpen(false);
  };

  const handleUpdate = () => {
    onSave(
      categories.map((c) =>
        c.id === editingId
          ? { ...c, name: draft.name.trim(), color: draft.color, emoji: draft.emoji }
          : c,
      ),
    );
    setEditingId(null);
    setDraft(emptyDraft());
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    onSave(categories.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Categories</h3>
        <Button size="sm" onClick={startAdd}>
          <Plus className="size-4 mr-2" />
          Add
        </Button>
      </div>

      {/* Fix: grow with the panel instead of a fixed ~4-row box; scroll only
          when there are genuinely more categories than fit. */}
      <div className="space-y-2 overflow-y-auto pr-1 max-h-[clamp(220px,60vh,560px)]">
        {categories.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
          >
            <span className="text-lg">{c.emoji}</span>
            <Badge variant="secondary" className={c.color}>
              {c.name}
            </Badge>
            <div className="ml-auto flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="size-7"
                onClick={() => startEdit(c.id)}
                aria-label={`Edit ${c.name}`}
              >
                <Pencil className="size-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-7 text-destructive"
                onClick={() => handleDelete(c.id)}
                disabled={categories.length <= 1}
                title={
                  categories.length <= 1 ? "Keep at least one category" : undefined
                }
                aria-label={`Delete ${c.name}`}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            No categories yet. Add your first one.
          </p>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Category" : "Add New Category"}
            </DialogTitle>
            <DialogDescription>Customize your prompt categories</DialogDescription>
          </DialogHeader>

          {/* Native scroll — reliable inside the dialog so the emoji / color /
              preview sections are always reachable. */}
          <div className="flex-1 overflow-y-auto px-1 -mx-1">
            <div className="space-y-4 py-2 pr-2">
              <div className="space-y-2">
                <Label htmlFor="category-name">Category Name</Label>
                <Input
                  id="category-name"
                  placeholder="e.g., SEO, Social Media, etc."
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                />
                <div className="space-y-2 pt-1">
                  <p className="text-xs text-muted-foreground">Suggestions:</p>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {NAME_SUGGESTIONS.map((s) => (
                      <Badge
                        key={s}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                        onClick={() => setDraft((d) => ({ ...d, name: s }))}
                      >
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Emoji</Label>
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className={cn(
                        "size-9 sm:size-10 flex items-center justify-center text-xl rounded-lg border-2 transition-all hover:scale-110",
                        draft.emoji === emoji
                          ? "border-primary bg-primary/10"
                          : "border-transparent bg-muted",
                      )}
                      onClick={() => setDraft((d) => ({ ...d, emoji }))}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="grid grid-cols-3 gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      className={cn(
                        "px-3 py-2 rounded-lg border-2 transition-all hover:scale-105 flex items-center justify-between",
                        draft.color === color.value
                          ? "border-primary"
                          : "border-transparent",
                      )}
                      style={{ backgroundColor: color.hex + "20" }}
                      onClick={() => setDraft((d) => ({ ...d, color: color.value }))}
                    >
                      <span
                        className="text-xs font-medium"
                        style={{ color: color.hex }}
                      >
                        {color.name}
                      </span>
                      {draft.color === color.value && (
                        <Check className="size-3" style={{ color: color.hex }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <Label>Preview</Label>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-2xl">{draft.emoji}</span>
                  <Badge variant="secondary" className={draft.color}>
                    {draft.name || "Your Category"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={editingId ? handleUpdate : handleAdd}
              disabled={!draft.name.trim()}
            >
              {editingId ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
