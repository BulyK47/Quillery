import { useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Lightbulb,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ModelBadge } from "@/components/ModelBadge";
import { optimizePrompt, modelTips } from "@/lib/optimizer";
import { copyToClipboard } from "@/lib/clipboard";
import { openInChat, type HandoffTargetId } from "@/lib/handoff";
import { MODELS } from "@/lib/models";
import { toast } from "sonner";
import type { OptimizationChange, OptimizationResult, Prompt, TargetModel } from "@/types";

interface OptimizeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt: Prompt | null;
  onApply: (content: string, model: TargetModel, result: OptimizationResult) => void;
}

const MODEL_OPTIONS: { value: TargetModel; label: string }[] = [
  { value: "chatgpt", label: "ChatGPT (OpenAI)" },
  { value: "claude", label: "Claude (Anthropic)" },
  { value: "gemini", label: "Gemini (Google)" },
];

export function OptimizeDialog({
  open,
  onOpenChange,
  prompt,
  onApply,
}: OptimizeDialogProps) {
  const original = prompt?.content || "";
  const [model, setModel] = useState<TargetModel>("chatgpt");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimized, setOptimized] = useState("");
  const [explanation, setExplanation] = useState<string[]>([]);
  const [changes, setChanges] = useState<OptimizationChange[]>([]);
  const [copied, setCopied] = useState(false);
  // Monotonic id so a superseded/closed optimize run discards its result.
  const runId = useRef(0);

  const resetResult = () => {
    setOptimized("");
    setExplanation([]);
    setChanges([]);
    setCopied(false);
  };

  // Fresh state every time the dialog opens for a (new) prompt.
  useEffect(() => {
    if (open) {
      setModel(
        prompt?.targetModel && prompt.targetModel !== "universal"
          ? prompt.targetModel
          : "chatgpt",
      );
      resetResult();
      setIsOptimizing(false);
    }
  }, [open, prompt]);

  const runOptimize = async () => {
    const id = ++runId.current;
    setIsOptimizing(true);
    // Brief delay to convey "working" (this is a local, rule-based optimizer).
    await new Promise((r) => setTimeout(r, 1200));
    if (runId.current !== id) return; // superseded by close / model change / re-run
    const result = optimizePrompt(original, model);
    setOptimized(result.content);
    setExplanation(result.explanation);
    setChanges(result.changes);
    setIsOptimizing(false);
    toast.success(`Optimized for ${MODELS[model].icon} ${model.toUpperCase()}!`);
  };

  const copyOptimized = async () => {
    if (await copyToClipboard(optimized)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Optimized prompt copied!");
    } else {
      toast.error("Copy failed");
    }
  };

  const apply = () => {
    // Parent (App) persists the change and shows the success toast.
    onApply(optimized, model, { content: optimized, explanation, changes });
    onOpenChange(false);
  };

  const openInTarget = async () => {
    const { mode, copied } = await openInChat(model as HandoffTargetId, optimized);
    const name = MODELS[model].name;
    if (mode === "clipboard" && !copied) {
      toast.error(`Opening ${name}…`, {
        description: "Couldn't copy the prompt — copy it manually to paste.",
      });
    } else {
      toast.success(`Opening in ${name}…`, {
        description:
          mode === "clipboard" ? "Prompt copied — paste it into the chat" : undefined,
      });
    }
  };

  const handleClose = (next: boolean) => {
    if (!next) {
      runId.current++; // supersede any in-flight optimize
      setIsOptimizing(false);
      resetResult();
    }
    onOpenChange(next);
  };

  if (!prompt) return null;
  const tips = modelTips(model);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            Multi-Model AI Optimizer
          </DialogTitle>
          <DialogDescription>
            Optimize your prompt specifically for ChatGPT, Claude, or Gemini
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="optimize" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="optimize">Optimization</TabsTrigger>
            <TabsTrigger value="tips">Guide &amp; Tips</TabsTrigger>
          </TabsList>

          <TabsContent value="optimize" className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Select Target Model</Label>
              <Select
                value={model}
                disabled={isOptimizing}
                onValueChange={(v) => {
                  setModel(v as TargetModel);
                  runId.current++; // discard any result tied to the old model
                  resetResult();
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODEL_OPTIONS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      <span className="flex items-center gap-2">
                        <span>{MODELS[m.value].icon}</span>
                        <span>{m.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Each AI model responds differently to prompting styles — select
                which one to optimize for.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Original Prompt</Label>
              <Textarea
                value={original}
                readOnly
                className="min-h-[100px] bg-muted/50 font-mono text-sm"
              />
            </div>

            {!optimized && (
              <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/30 rounded-lg border border-dashed">
                <div className="flex-1 min-w-[12rem]">
                  <p className="text-sm font-medium">Multi-Model Optimization</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 flex-wrap">
                    Adapt the prompt for the style and preferences of{" "}
                    <ModelBadge model={model} />
                  </p>
                </div>
                <Button onClick={runOptimize} disabled={isOptimizing} className="gap-2">
                  {isOptimizing ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      Optimize for {MODELS[model].icon}
                    </>
                  )}
                </Button>
              </div>
            )}

            {optimized && (
              <>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-primary flex items-center gap-2">
                        <Sparkles className="size-4" />
                        Optimized for
                      </Label>
                      <ModelBadge model={model} />
                    </div>
                    <Button variant="ghost" size="sm" onClick={copyOptimized} className="gap-2">
                      {copied ? (
                        <>
                          <Check className="size-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="size-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <Textarea
                    value={optimized}
                    onChange={(e) => setOptimized(e.target.value)}
                    className="min-h-[150px] font-mono text-sm"
                  />
                </div>

                {(changes.length > 0 || explanation.length > 0) && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Wand2 className="size-4" />
                      Changes &amp; Explanations
                    </Label>
                    {changes.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {changes.map((c, i) => (
                          <Badge key={i} variant="secondary">
                            {c.description}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                      {explanation.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            <Card className="p-3 bg-muted/30 text-xs text-muted-foreground">
              <p className="font-medium mb-1">💡 Local optimization</p>
              <p>
                Optimization runs entirely on your device using proven
                model-specific best practices — nothing is sent to any API.
              </p>
            </Card>

            {optimized && (
              <div className="sticky bottom-0 -mx-6 -mb-4 flex flex-wrap items-center justify-between gap-2 border-t border-border bg-background px-6 py-3">
                <Button
                  variant="outline"
                  onClick={runOptimize}
                  disabled={isOptimizing}
                  className="gap-2"
                >
                  {isOptimizing ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Re-optimizing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      Re-optimize
                    </>
                  )}
                </Button>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => handleClose(false)}>
                    Cancel
                  </Button>
                  <Button variant="secondary" onClick={openInTarget} className="gap-2">
                    <ExternalLink className="size-4" />
                    Open in {MODELS[model].icon}
                  </Button>
                  <Button onClick={apply} className="gap-2">
                    <Check className="size-4" />
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="tips" className="space-y-4 py-4">
            <div className="flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-200 dark:border-blue-800 rounded-lg">
              <Lightbulb className="size-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div className="space-y-2 flex-1">
                <h4 className="font-semibold flex items-center gap-2 flex-wrap">
                  Best Practices for <ModelBadge model={model} />
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                  {tips.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
