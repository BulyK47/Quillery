import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (id: string) => void;
  categories: Category[];
}

export function SearchBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
}: SearchBarProps) {
  const allCategories: Category[] = [
    { id: "all", name: "All", emoji: "📋", color: "" },
    ...categories,
  ];

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search prompts..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 size-8"
            onClick={() => onSearchChange("")}
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-1">
        {allCategories.map((c) => (
          <Badge
            key={c.id}
            variant={selectedCategory === c.id ? "default" : "outline"}
            className={cn(
              "cursor-pointer hover:bg-primary/10 shrink-0",
              selectedCategory === c.id ? "" : c.color,
            )}
            onClick={() => onCategoryChange(c.id)}
          >
            {c.emoji && <span className="mr-1">{c.emoji}</span>}
            {c.name}
          </Badge>
        ))}
      </div>
    </div>
  );
}
