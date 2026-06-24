import {
  ArrowDownAZ,
  Clock,
  ListFilter,
  Pin,
  Star,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { SortOption } from "@/types";

const OPTIONS: { value: SortOption; label: string; icon: typeof Pin }[] = [
  { value: "usage", label: "Most used", icon: TrendingUp },
  { value: "rating", label: "Rating (⭐)", icon: Star },
  { value: "recent", label: "Most recent", icon: Clock },
  { value: "alphabetical", label: "Alphabetical (A-Z)", icon: ArrowDownAZ },
  { value: "pinned", label: "Pinned first", icon: Pin },
];

export function SortMenu({
  currentSort,
  onSortChange,
}: {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}) {
  const active = OPTIONS.find((o) => o.value === currentSort);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <ListFilter className="size-4 mr-2" />
          {active?.label ?? "Sort"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Sort by:</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {OPTIONS.map((o) => (
          <DropdownMenuItem
            key={o.value}
            onClick={() => onSortChange(o.value)}
            className={cn(currentSort === o.value && "bg-accent")}
          >
            <o.icon className="size-4 mr-2" />
            {o.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
