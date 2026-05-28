"use client";

import { Search, X, Plus, Download } from "lucide-react";
import type { FiltersState } from "./types";
import { CITIES, PLANS, STATUSES } from "./types";

interface Props {
  filters:   FiltersState;
  onChange:  (partial: Partial<FiltersState>) => void;
  onReset:   () => void;
  onAdd:     () => void;
  onExport:  () => void;
}

const selectCls = "bg-cream-light border border-border rounded-lg px-3 py-2 text-sm text-dark focus:outline-none focus:border-gold";

export default function FiltersBar({ filters, onChange, onReset, onAdd, onExport }: Props) {
  const hasFilters =
    filters.search ||
    filters.city   !== "الكل" ||
    filters.status !== "all"  ||
    filters.plan   !== "الكل" ||
    filters.dateFrom;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-border">
      <div className="flex flex-wrap gap-3 items-center">

        {/* البحث */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-text pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="بحث باسم المحل أو المالك..."
            className="w-full bg-cream-light border border-border rounded-lg pr-9 pl-3 py-2 text-sm text-dark placeholder:text-gray-text focus:outline-none focus:border-gold"
          />
        </div>

        {/* المدينة */}
        <select value={filters.city} onChange={(e) => onChange({ city: e.target.value })} className={selectCls}>
          {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* الحالة */}
        <select value={filters.status} onChange={(e) => onChange({ status: e.target.value })} className={selectCls}>
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        {/* الباقة */}
        <select value={filters.plan} onChange={(e) => onChange({ plan: e.target.value })} className={selectCls}>
          {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>

        {/* تاريخ التسجيل */}
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => onChange({ dateFrom: e.target.value })}
          className={selectCls}
        />

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

        <div className="flex-1" />

        {/* تصدير */}
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm text-gray-text hover:border-gold hover:text-gold transition-colors"
        >
          <Download size={15} />
          تصدير
        </button>

        {/* إضافة محل */}
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 bg-gold text-navy rounded-lg text-sm font-semibold hover:bg-gold/90 transition-colors"
        >
          <Plus size={15} />
          إضافة محل جديد
        </button>

      </div>
    </div>
  );
}