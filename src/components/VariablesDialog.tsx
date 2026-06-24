import { useEffect, useState } from "react";
import { Eye, Variable } from "lucide-react";
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
import { replaceVariables } from "@/lib/variables";

interface VariablesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variables: string[];
  onConfirm: (values: Record<string, string>) => void;
  promptTitle?: string;
  promptContent?: string;
}

export function VariablesDialog({
  open,
  onOpenChange,
  variables,
  onConfirm,
  promptTitle,
  promptContent,
}: VariablesDialogProps) {
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      const init: Record<string, string> = {};
      variables.forEach((v) => (init[v] = ""));
      setValues(init);
    }
  }, [open, variables]);

  const allFilled = variables.every((v) => values[v]?.trim());

  const handleConfirm = () => {
    if (allFilled) {
      onConfirm(values);
      onOpenChange(false);
    }
  };

  // Reuse the real replacement so the preview can never diverge from the copy,
  // and so a variable name with regex-special chars can't crash the dialog.
  const preview = promptContent
    ? replaceVariables(
        promptContent,
        Object.fromEntries(
          variables.map((v) => [v, values[v]?.trim() ? values[v] : `{{${v}}}`]),
        ),
      )
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Variable className="size-5 text-primary" />
            Fill Variables
          </DialogTitle>
          <DialogDescription>
            {promptTitle ? `For: "${promptTitle}"` : "Fill in values for variables"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {variables.map((v) => (
            <div key={v} className="space-y-2">
              <Label htmlFor={v} className="flex items-center gap-2">
                <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                  {`{{${v}}}`}
                </span>
              </Label>
              <Input
                id={v}
                placeholder={`Enter value for ${v}`}
                value={values[v] || ""}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [v]: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && allFilled) handleConfirm();
                }}
              />
            </div>
          ))}

          {preview && (
            <div className="space-y-2 pt-4 border-t border-border">
              <Label className="flex items-center gap-2 text-sm font-semibold">
                <Eye className="size-4" />
                Live Preview
              </Label>
              <div className="h-32 overflow-y-auto rounded-md border border-border bg-muted/30 p-3">
                <p className="text-sm whitespace-pre-wrap font-mono">{preview}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!allFilled}>
            Copy with Variables
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
