"use client";

import { Search, X } from "lucide-react";
import type { FiltersState } from "./types";

interface Props {
  filters:  FiltersState;
  onChange: (p: Partial<FiltersState>) => void;
  onReset:  () => void;
}

export default function SearchBar({ filters, onChange, onReset }: Props) {
  const hasFilters = filters.search || filters.status !== "all";

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-border flex flex-wrap gap-3 items-center">

      {/* البحث */}
      <div className="relative flex-1 min-w-[220px]">
        <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-text pointer-events-none" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
          placeholder="بحث بالاسم أو البريد أو الهاتف..."
          className="w-full bg-cream-light border border-border rounded-lg pr-9 pl-3 py-2 text-sm text-dark placeholder:text-gray-text focus:outline-none focus:border-gold"
        />
      </div>

      {/* فلتر الحالة */}
      <select
        value={filters.status}
        onChange={(e) => onChange({ status: e.target.value })}
        className="bg-cream-light border border-border rounded-lg px-3 py-2 text-sm text-dark focus:outline-none focus:border-gold"
      >
        <option value="all">كل الحالات</option>
        <option value="active">نشط</option>
        <option value="disabled">معطل</option>
      </select>

      {/* إعادة التعيين */}
      {hasFilters && (
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-sm text-gray-text hover:text-red-500 transition-colors"
        >
          <X size={14} />
          إعادة التعيين
        </button>
      )}
    </div>
  );
}