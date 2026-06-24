import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category, Prompt } from "@/types";

export interface PromptDraft {
  id?: string;
  title: string;
  content: string;
  category: string;
  tags?: string[];
}

interface PromptEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (draft: PromptDraft) => void;
  prompt: Prompt | null;
  categories: Category[];
}

export function PromptEditor({
  isOpen,
  onClose,
  onSave,
  prompt,
  categories,
}: PromptEditorProps) {
  const fallbackCategory = categories[0]?.id ?? "other";
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState(fallbackCategory);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (prompt) {
      setTitle(prompt.title);
      setContent(prompt.content);
      // If the prompt's category was deleted, fall back to a valid one so the
      // Select isn't blank.
      setCategory(
        categories.some((c) => c.id === prompt.category)
          ? prompt.category
          : categories[0]?.id ?? "other",
      );
      setTags(prompt.tags ?? []);
    } else {
      setTitle("");
      setContent("");
      setCategory(categories[0]?.id ?? "other");
      setTags([]);
    }
    setTagInput("");
  }, [prompt, isOpen, categories]);

  const addTag = () => {
    const value = tagInput.trim();
    if (value && !tags.includes(value)) {
      setTags([...tags, value]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const handleSave = () => {
    if (!content.trim()) return;
    onSave({
      id: prompt?.id,
      title: title.trim(),
      content: content.trim(),
      category,
      tags: tags.length > 0 ? tags : undefined,
    });
    onClose();
  };

  const charCount = content.length;
  const tokenEstimate = Math.ceil(charCount / 4);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{prompt ? "Edit Prompt" : "New Prompt"}</DialogTitle>
          <DialogDescription>
            {prompt ? "Modify existing prompt" : "Create a new prompt"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title (optional)</Label>
            <Input
              id="title"
              placeholder="e.g., Professional email, API request, etc."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-2">
                      <span>{c.emoji}</span>
                      <span>{c.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Prompt Content *</Label>
            <Textarea
              id="content"
              placeholder="Enter your prompt here... Use {{variable}} for placeholders."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              className="resize-none font-mono text-sm"
            />
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{charCount} characters</span>
            <span>•</span>
            <span>~{tokenEstimate} estimated tokens</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="tags"
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={addTag}
                disabled={!tagInput.trim()}
              >
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => removeTag(tag)}
                  >
                    {tag} ✕
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!content.trim()}>
            {prompt ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
