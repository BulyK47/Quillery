import { Download, GitMerge, Replace } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { BackupData } from "@/lib/backup";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: BackupData | null;
  /** True if the user already has prompts/categories that import could affect. */
  hasExisting: boolean;
  onReplace: () => void;
  onMerge: () => void;
}

export function ImportDialog({
  open,
  onOpenChange,
  data,
  hasExisting,
  onReplace,
  onMerge,
}: ImportDialogProps) {
  const promptCount = data?.prompts.length ?? 0;
  const categoryCount = data?.categories.length ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="size-5 text-primary" />
            Import backup
          </DialogTitle>
          <DialogDescription>
            This file contains{" "}
            <strong>
              {promptCount} {promptCount === 1 ? "prompt" : "prompts"}
            </strong>{" "}
            and{" "}
            <strong>
              {categoryCount} {categoryCount === 1 ? "category" : "categories"}
            </strong>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-sm">
          {hasExisting ? (
            <>
              <p className="text-muted-foreground">
                Choose how to bring it in:
              </p>
              <div className="rounded-lg border border-border p-3">
                <p className="font-medium flex items-center gap-2">
                  <GitMerge className="size-4" />
                  Merge
                </p>
                <p className="text-muted-foreground mt-1">
                  Keep your current prompts and add the file's. Items with the
                  same id are updated from the file.
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="font-medium flex items-center gap-2">
                  <Replace className="size-4" />
                  Replace all
                </p>
                <p className="text-muted-foreground mt-1">
                  Discard your current prompts and categories and use only what's
                  in the file.
                </p>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">
              Your library is empty, so this will simply load everything from the
              file.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {hasExisting && (
            <Button variant="outline" onClick={onReplace} className="gap-2">
              <Replace className="size-4" />
              Replace all
            </Button>
          )}
          <Button onClick={hasExisting ? onMerge : onReplace} className="gap-2">
            {hasExisting ? (
              <>
                <GitMerge className="size-4" />
                Merge
              </>
            ) : (
              <>
                <Download className="size-4" />
                Import
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
