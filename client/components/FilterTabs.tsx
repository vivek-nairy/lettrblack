import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterOption {
  id: string;
  name: string;
  icon: typeof Sparkles;
}

interface FilterTabsProps {
  filters: FilterOption[];
  selectedFilter: string;
  onFilterChange: (filterId: string) => void;
}

export function FilterTabs({ filters, selectedFilter, onFilterChange }: FilterTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
            selectedFilter === filter.id
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          <filter.icon className="w-4 h-4" />
          {filter.name}
        </button>
      ))}
    </div>
  );
} 