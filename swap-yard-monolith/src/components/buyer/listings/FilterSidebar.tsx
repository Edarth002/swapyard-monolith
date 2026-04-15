// components/buyer/FilterSidebar.tsx
"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ShieldCheck, Search } from "lucide-react";

interface FilterSidebarProps {
  currentFilters: URLSearchParams;
  onFilterChange: (key: string, value: string, isArray?: boolean) => void;
}

export default function FilterSidebar({ currentFilters, onFilterChange }: FilterSidebarProps) {
  const categories = ["All Items", "Furniture", "Kitchen & Dining", "Office", "Bedroom", "Decor", "Baby & Kids", "Outdoor"];
  const conditions = ["New", "Barely Used", "Used", "Needs Repair"];

  // Local state for prices to prevent re-rendering on every keystroke
  const [minPrice, setMinPrice] = useState(currentFilters.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(currentFilters.get("maxPrice") || "");

  // Sync local state if the URL changes externally (e.g., clearing filters from the top bar)
  useEffect(() => {
    setMinPrice(currentFilters.get("minPrice") || "");
    setMaxPrice(currentFilters.get("maxPrice") || "");
  }, [currentFilters]);

  // Helper to check if a checkbox should be checked
  const isChecked = (key: string, value: string) => {
    const params = currentFilters.getAll(key);
    return params.includes(value); // Ensure exact string match with backend
  };

  // Helper to handle checkbox clicks
  const handleCheck = (key: string, value: string) => {
    // If "All Items" is clicked, clear the category filter completely
    if (key === "category" && value === "All Items") {
      onFilterChange("category", "", false);
      return;
    }

    onFilterChange(key, value, true);
  };

  // Helper to submit price
  const handlePriceSubmit = (key: string, value: string) => {
    onFilterChange(key, value, false);
  };

  return (
    <aside className="w-full lg:w-64 flex-shrink-0 space-y-8">
      <h2 className="text-lg font-bold text-gray-900">Filter Options</h2>

      {/* Categories */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900">Categories</h3>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </div>
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search category..."
            className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
          <Search className="absolute left-2.5 top-2.5 text-gray-400 w-4 h-4" />
        </div>
        <div className="space-y-3">
          {categories.map((cat) => (
            <label key={cat} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                // "All Items" is checked if there are no specific categories in the URL
                checked={cat === "All Items" ? !currentFilters.has("category") : isChecked("category", cat)}
                onChange={() => handleCheck("category", cat)}
                className="w-4 h-4 rounded border-gray-300 text-[#EB3B18] focus:ring-[#EB3B18]"
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{cat}</span>
            </label>
          ))}
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Item Conditions */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900">Item Conditions</h3>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </div>
        <div className="space-y-3">
          {conditions.map((cond) => (
            <label key={cond} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={isChecked("condition", cond)}
                onChange={() => handleCheck("condition", cond)}
                className="w-4 h-4 rounded border-gray-300 text-[#EB3B18] focus:ring-[#EB3B18]"
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{cond}</span>
            </label>
          ))}
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Price Range */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Price Range</h3>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">MIN</label>
            <input
              type="number"
              placeholder="₦10,000"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              onBlur={() => handlePriceSubmit("minPrice", minPrice)}
              onKeyDown={(e) => e.key === 'Enter' && handlePriceSubmit("minPrice", minPrice)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>
          <span className="text-gray-400 mt-5">—</span>
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">MAX</label>
            <input
              type="number"
              placeholder="₦50,000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              onBlur={() => handlePriceSubmit("maxPrice", maxPrice)}
              onKeyDown={(e) => e.key === 'Enter' && handlePriceSubmit("maxPrice", maxPrice)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* SwapYard Guarantee Box */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <h4 className="font-bold text-gray-900 text-sm">SwapYard Guarantee</h4>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">
          All listings from verified sellers are eligible for our secure transaction protection.
        </p>
      </div>
    </aside>
  );
}