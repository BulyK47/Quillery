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
import { StarRating } from "@/components/StarRating";
import type { Prompt } from "@/types";

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt: Prompt | null;
  onSave: (rating: number) => void;
}

export function RatingDialog({
  open,
  onOpenChange,
  prompt,
  onSave,
}: RatingDialogProps) {
  const [rating, setRating] = useState(0);

  useEffect(() => {
    if (open) setRating(prompt?.rating ?? 0);
  }, [open, prompt]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Rate Prompt</DialogTitle>
          <DialogDescription>
            {prompt?.title ? `How useful is "${prompt.title}"?` : "Rate this prompt"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-6">
          <StarRating rating={rating} onRatingChange={setRating} size="lg" />
          <span className="text-sm text-muted-foreground">
            {rating > 0 ? `${rating}/5` : "Tap a star"}
          </span>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onSave(rating)} disabled={rating === 0}>
            Save Rating
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
