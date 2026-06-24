import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Download,
  FileDown,
  FileText,
  Keyboard,
  Moon,
  Plus,
  Settings,
  Sun,
  Upload,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PromptCard } from "@/components/PromptCard";
import { PromptEditor, type PromptDraft } from "@/components/PromptEditor";
import { CategoryManager } from "@/components/CategoryManager";
import { SearchBar } from "@/components/SearchBar";
import { SortMenu } from "@/components/SortMenu";
import { Statistics } from "@/components/Statistics";
import { VariablesDialog } from "@/components/VariablesDialog";
import { OptimizeDialog } from "@/components/OptimizeDialog";
import { RatingDialog } from "@/components/RatingDialog";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useExternalStore } from "@/hooks/useExternalStore";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useTheme } from "@/hooks/useTheme";
import { SyncSettings } from "@/components/SyncSettings";
import { DEFAULT_CATEGORIES, defaultPrompts } from "@/lib/defaults";
import { searchPrompts } from "@/lib/search";
import { exportMarkdown } from "@/lib/export";
import {
  exportBackup,
  mergeById,
  parseBackup,
  type BackupData,
} from "@/lib/backup";
import { ImportDialog } from "@/components/ImportDialog";
import { copyToClipboard } from "@/lib/clipboard";
import { extractVariables, replaceVariables } from "@/lib/variables";
import { newId } from "@/lib/id";
import type {
  Category,
  OptimizationResult,
  Prompt,
  SortOption,
  TargetModel,
} from "@/types";

export default function App() {
  const { resolvedTheme, setTheme } = useTheme();
  const [prompts, setPrompts] = useLocalStorage<Prompt[]>(
    "prompts",
    defaultPrompts(),
  );
  const [categories, setCategories] = useLocalStorage<Category[]>(
    "categories",
    DEFAULT_CATEGORIES,
  );

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("pinned");
  const [activeTab, setActiveTab] = useState("prompts");

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const [variablesOpen, setVariablesOpen] = useState(false);
  const [variablePrompt, setVariablePrompt] = useState<Prompt | null>(null);
  const [variableNames, setVariableNames] = useState<string[]>([]);

  const [optimizeOpen, setOptimizeOpen] = useState(false);
  const [optimizingPrompt, setOptimizingPrompt] = useState<Prompt | null>(null);

  const [ratingOpen, setRatingOpen] = useState(false);
  const [ratingPrompt, setRatingPrompt] = useState<Prompt | null>(null);

  const [importOpen, setImportOpen] = useState(false);
  const [importData, setImportData] = useState<BackupData | null>(null);

  // Optional cross-device sync (Electron sync folder / extension chrome.storage).
  // No-op on the plain web app.
  const [syncRefresh, setSyncRefresh] = useState(0);
  useExternalStore({
    prompts,
    categories,
    setPrompts,
    setCategories,
    refreshKey: syncRefresh,
  });

  const filtered = useMemo(() => {
    let list = prompts;
    if (selectedCategory !== "all") {
      list = list.filter((p) => p.category === selectedCategory);
    }
    if (search.trim()) {
      list = searchPrompts(list, search);
    }
    return [...list].sort((a, b) => {
      switch (sortBy) {
        case "usage":
          return b.usageCount - a.usageCount;
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "recent":
          return b.updatedAt - a.updatedAt;
        case "alphabetical":
          return a.title.localeCompare(b.title);
        case "pinned":
        default:
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          if (a.usageCount !== b.usageCount) return b.usageCount - a.usageCount;
          return b.updatedAt - a.updatedAt;
      }
    });
  }, [prompts, selectedCategory, search, sortBy]);

  // If the actively-filtered category gets deleted, fall back to "All" so the
  // list doesn't silently show zero results against a non-existent filter.
  useEffect(() => {
    if (
      selectedCategory !== "all" &&
      !categories.some((c) => c.id === selectedCategory)
    ) {
      setSelectedCategory("all");
    }
  }, [categories, selectedCategory]);

  const markUsed = (id: string) =>
    setPrompts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, usageCount: p.usageCount + 1, lastUsed: Date.now() }
          : p,
      ),
    );

  const handleCopy = async (prompt: Prompt): Promise<boolean> => {
    const vars = extractVariables(prompt.content);
    if (vars.length > 0) {
      setVariablePrompt(prompt);
      setVariableNames(vars);
      setVariablesOpen(true);
      return false; // deferred to the variables dialog — nothing copied yet
    }
    if (await copyToClipboard(prompt.content)) {
      markUsed(prompt.id);
      toast.success("Copied to clipboard!", {
        description: prompt.title || "Prompt copied successfully",
      });
      return true;
    }
    toast.error("Copy error", { description: "Could not copy to clipboard" });
    return false;
  };

  const handleVariablesConfirm = async (values: Record<string, string>) => {
    if (!variablePrompt) return;
    const filled = replaceVariables(variablePrompt.content, values);
    if (await copyToClipboard(filled)) {
      markUsed(variablePrompt.id);
      toast.success("Copied with variables!", {
        description: variablePrompt.title || "Personalized prompt copied",
      });
    } else {
      toast.error("Copy error", { description: "Could not copy to clipboard" });
    }
    setVariablePrompt(null);
  };

  const handleOptimizeOpen = (prompt: Prompt) => {
    setOptimizingPrompt(prompt);
    setOptimizeOpen(true);
  };

  const handleApplyOptimization = (
    content: string,
    model: TargetModel,
    result: OptimizationResult,
  ) => {
    if (!optimizingPrompt) return;
    setPrompts((prev) =>
      prev.map((p) =>
        p.id === optimizingPrompt.id
          ? {
              ...p,
              content,
              targetModel: model,
              modelOptimizations: [
                ...(p.modelOptimizations || []),
                {
                  model,
                  content,
                  explanation: result.explanation,
                  changes: result.changes,
                  timestamp: Date.now(),
                },
              ],
              updatedAt: Date.now(),
            }
          : p,
      ),
    );
    toast.success(`Prompt optimized for ${model.toUpperCase()}!`);
    setOptimizingPrompt(null);
    setOptimizeOpen(false);
  };

  const handleSavePrompt = (draft: PromptDraft) => {
    if (draft.id) {
      setPrompts((prev) =>
        prev.map((p) =>
          p.id === draft.id ? { ...p, ...draft, updatedAt: Date.now() } : p,
        ),
      );
      toast.success("Prompt updated!");
    } else {
      const created: Prompt = {
        id: newId(),
        title: draft.title || "",
        content: draft.content || "",
        category: draft.category || categories[0]?.id || "other",
        tags: draft.tags,
        isPinned: false,
        usageCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setPrompts((prev) => [created, ...prev]);
      toast.success("Prompt created!");
    }
  };

  const handleDuplicate = (prompt: Prompt) => {
    const copy: Prompt = {
      ...prompt,
      id: newId(),
      title: `${prompt.title} (copy)`,
      isPinned: false,
      usageCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setPrompts((prev) => [copy, ...prev]);
    toast.success("Prompt duplicated!");
  };

  const handleRateOpen = (prompt: Prompt) => {
    setRatingPrompt(prompt);
    setRatingOpen(true);
  };

  const handleSaveRating = (rating: number) => {
    if (!ratingPrompt) return;
    setPrompts((prev) =>
      prev.map((p) =>
        p.id === ratingPrompt.id ? { ...p, rating, updatedAt: Date.now() } : p,
      ),
    );
    toast.success(`Rating saved: ${rating}/5 ⭐`);
    setRatingPrompt(null);
    setRatingOpen(false);
  };

  const handleDelete = (id: string) => {
    setPrompts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Prompt deleted!");
  };

  const handleTogglePin = (id: string) =>
    setPrompts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isPinned: !p.isPinned } : p)),
    );

  const openNew = () => {
    setEditingPrompt(null);
    setEditorOpen(true);
  };

  const openEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setEditorOpen(true);
  };

  const handleQuickCopy = (index: number) => {
    // Stable order independent of the active sort/search/category, so Ctrl+N
    // always maps to the same pinned prompt ("Copy pinned prompt #1-9").
    const pinned = prompts
      .filter((p) => p.isPinned)
      .sort((a, b) =>
        a.usageCount !== b.usageCount
          ? b.usageCount - a.usageCount
          : b.updatedAt - a.updatedAt,
      );
    if (index < pinned.length) handleCopy(pinned[index]);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (file.size > 8_000_000) {
        toast.error("That file is too large", {
          description: "A Quillery backup is small JSON — this doesn't look right.",
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const parsed = parseBackup(String(ev.target?.result));
        if (!parsed) {
          toast.error("Couldn't read that file", {
            description: "It doesn't look like a Quillery backup.",
          });
          return;
        }
        setImportData(parsed);
        setImportOpen(true);
      };
      reader.onerror = () => toast.error("Couldn't read that file");
      reader.readAsText(file);
    };
    input.click();
  };

  const applyImport = (mode: "merge" | "replace") => {
    if (!importData) return;
    // Snapshot so the import can be undone in one click.
    const prevPrompts = prompts;
    const prevCategories = categories;

    if (mode === "replace") {
      // Only replace a section the file actually provides, so a partial backup
      // (e.g. categories-only) can't silently wipe the other section.
      if (importData.prompts.length > 0) setPrompts(importData.prompts);
      if (importData.categories.length > 0) setCategories(importData.categories);
    } else {
      setPrompts((prev) => mergeById(prev, importData.prompts));
      setCategories((prev) => mergeById(prev, importData.categories));
    }

    toast.success(mode === "replace" ? "Backup restored!" : "Backup merged!", {
      description: `${importData.prompts.length} prompts, ${importData.categories.length} categories`,
      action: {
        label: "Undo",
        onClick: () => {
          setPrompts(prevPrompts);
          setCategories(prevCategories);
        },
      },
    });
    setImportOpen(false);
    setImportData(null);
  };

  useKeyboardShortcuts({ onNewPrompt: openNew, onQuickCopy: handleQuickCopy });

  return (
    <div className="h-full w-full bg-background flex flex-col overflow-hidden">
      <div className="mx-auto flex h-full w-full max-w-3xl flex-col overflow-hidden">
        <header className="border-b border-border bg-background shrink-0">
          <div className="p-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Quillery</h1>
              <p className="text-xs text-muted-foreground">
                Organize &amp; optimize your prompts
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => setSettingsOpen(true)}
                aria-label="Settings"
              >
                <Settings className="size-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label="Export and import"
                  >
                    <Download className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      exportBackup(prompts, categories);
                      toast.success("Backup saved!", {
                        description: "quillery-backup-….json — import it on another device",
                      });
                    }}
                  >
                    <Download className="size-4 mr-2" />
                    Export backup (.json)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleImport}>
                    <Upload className="size-4 mr-2" />
                    Import backup…
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      exportMarkdown(prompts, categories);
                      toast.success("Markdown export completed!");
                    }}
                  >
                    <FileDown className="size-4 mr-2" />
                    Export as Markdown
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShortcutsOpen(true)}>
                    <Keyboard className="size-4 mr-2" />
                    Shortcuts
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
              >
                {resolvedTheme === "dark" ? (
                  <Sun className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )}
              </Button>
              <Button onClick={openNew} size="sm">
                <Plus className="size-4 mr-1" />
                New
              </Button>
            </div>
          </div>
        </header>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="border-b border-border px-4 shrink-0">
            <TabsList className="w-full grid grid-cols-2 my-2">
              <TabsTrigger value="prompts" className="gap-2">
                <FileText className="size-4" />
                Prompts
              </TabsTrigger>
              <TabsTrigger value="stats" className="gap-2">
                <BarChart3 className="size-4" />
                Stats
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="prompts"
            className="flex-1 flex flex-col overflow-hidden m-0 data-[state=inactive]:hidden"
          >
            <div className="p-4 space-y-3 shrink-0">
              <SearchBar
                searchQuery={search}
                onSearchChange={setSearch}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                categories={categories}
              />
              <div className="flex items-center justify-end">
                <SortMenu currentSort={sortBy} onSortChange={setSortBy} />
              </div>
            </div>

            <ScrollArea className="flex-1">
              {filtered.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <p className="text-muted-foreground">
                    {search || selectedCategory !== "all"
                      ? "No prompts found"
                      : "No prompts yet"}
                  </p>
                  <Button className="mt-4" onClick={openNew} size="sm">
                    <Plus className="size-4 mr-2" />
                    Create first prompt
                  </Button>
                </div>
              ) : (
                <div className="px-4 pb-4 space-y-3">
                  {filtered.map((prompt) => (
                    <PromptCard
                      key={prompt.id}
                      prompt={prompt}
                      categories={categories}
                      onCopy={handleCopy}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                      onTogglePin={handleTogglePin}
                      onOptimize={handleOptimizeOpen}
                      onDuplicate={handleDuplicate}
                      onRate={handleRateOpen}
                      layout="vertical"
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent
            value="stats"
            className="flex-1 overflow-hidden m-0 data-[state=inactive]:hidden"
          >
            <ScrollArea className="h-full">
              <Statistics prompts={prompts} categories={categories} />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent side="left" className="w-[400px] max-w-[90vw] flex flex-col">
          <SheetHeader>
            <SheetTitle>Settings</SheetTitle>
            <SheetDescription>Manage categories and preferences</SheetDescription>
          </SheetHeader>
          <div className="mt-6 flex-1 overflow-y-auto pr-1 space-y-4">
            <CategoryManager categories={categories} onSave={setCategories} />
            <SyncSettings onChanged={() => setSyncRefresh((k) => k + 1)} />
          </div>
        </SheetContent>
      </Sheet>

      <PromptEditor
        isOpen={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditingPrompt(null);
        }}
        onSave={handleSavePrompt}
        prompt={editingPrompt}
        categories={categories}
      />

      <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <DialogDescription>
              Use these shortcuts to work more efficiently
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">New prompt</span>
              <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded">
                Ctrl + Shift + P
              </kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Copy pinned prompt #1-9</span>
              <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded">
                Ctrl + 1-9
              </kbd>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <VariablesDialog
        open={variablesOpen}
        onOpenChange={setVariablesOpen}
        variables={variableNames}
        onConfirm={handleVariablesConfirm}
        promptTitle={variablePrompt?.title}
        promptContent={variablePrompt?.content}
      />

      <OptimizeDialog
        open={optimizeOpen}
        onOpenChange={setOptimizeOpen}
        prompt={optimizingPrompt}
        onApply={handleApplyOptimization}
      />

      <RatingDialog
        open={ratingOpen}
        onOpenChange={setRatingOpen}
        prompt={ratingPrompt}
        onSave={handleSaveRating}
      />

      <ImportDialog
        open={importOpen}
        onOpenChange={(o) => {
          setImportOpen(o);
          if (!o) setImportData(null);
        }}
        data={importData}
        hasExisting={prompts.length > 0}
        onReplace={() => applyImport("replace")}
        onMerge={() => applyImport("merge")}
      />

      <Toaster richColors position="bottom-center" />
    </div>
  );
}
