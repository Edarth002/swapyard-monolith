// components/buyer/SortAndDisplayMenu.tsx
import { LayoutGrid, Map, ChevronDown } from "lucide-react";

interface SortAndDisplayMenuProps {
  totalItems: number;
  categoryName?: string;
}

export default function SortAndDisplayMenu({ totalItems, categoryName = "All Categories" }: SortAndDisplayMenuProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-100 mb-6 gap-4">
      
      {/* Search Result Summary */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Browse Listings</h1>
        <p className="text-sm text-gray-500">
          Showing <span className="font-bold text-gray-900">{totalItems}</span> items found in {categoryName}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sort By:</span>
          <button className="flex items-center gap-1 text-sm font-bold text-gray-900 hover:text-gray-600">
            Newest
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        <div className="h-6 w-px bg-gray-200 mx-2 hidden sm:block"></div>

        <div className="flex items-center gap-2">
          <button aria-label="Grid view" className="p-2 rounded-md bg-gray-100 text-gray-900">
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button aria-label="Map view" className="p-2 rounded-md text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors">
            <Map className="w-4 h-4" />
          </button>
        </div>
      </div>
      
    </div>
  );
}