import React from "react";
import { X } from "lucide-react";

// 1. Update the interface to include the optional 'value' string
interface FilterBadge {
  key: string;
  value?: string; // Added this
  label: string;
}

// 2. Update onRemove to expect the second argument
interface ActiveFiltersBarProps {
  activeFilters: FilterBadge[];
  onRemove: (key: string, value?: string) => void; // Updated this
  onClearAll: () => void;
}

export default function ActiveFiltersBar({
  activeFilters,
  onRemove,
  onClearAll,
}: ActiveFiltersBarProps) {
  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {activeFilters.map((filter, index) => (
        <span
          key={`${filter.key}-${index}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-sm font-medium text-gray-700 border border-gray-200"
        >
          {filter.label}
          <button
            // 3. Pass both arguments back up to page.tsx
            onClick={() => onRemove(filter.key, filter.value)}
            aria-label="Remove filter"
            className="hover:text-[#EB3B18] transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </span>
      ))}
      <button
        onClick={onClearAll}
        className="text-xs font-bold text-gray-900 hover:text-[#EB3B18] ml-2 transition-colors underline decoration-gray-300 underline-offset-4 cursor-pointer"
      >
        Clear All Filters
      </button>
    </div>
  );
}