import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

const SIZE: Record<NonNullable<StarRatingProps["size"]>, string> = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
};

export function StarRating({
  rating,
  onRatingChange,
  readonly = false,
  size = "sm",
}: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onRatingChange?.(value)}
          className={cn(
            "transition-all",
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110",
          )}
        >
          <Star
            className={cn(
              SIZE[size],
              value <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300 dark:text-gray-600",
            )}
          />
        </button>
      ))}
    </div>
  );
}
