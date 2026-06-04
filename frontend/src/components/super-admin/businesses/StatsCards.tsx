"use client";
import { useLanguage } from "@/context/LanguageContext";

import { Building2, CheckCircle2, Ban, AlertCircle, CalendarDays, TrendingUp } from "lucide-react";
import type { StatsData } from "./types";

interface Props {
  stats: StatsData;
}

export default function StatsCards({
  stats }: Props) {
  const { t } = useLanguage();
  const cards = [
    {
      label: t("superAdmin.businesses.stats.total"),
      value: stats.total.toLocaleString("ar-MA"),
      icon:  Building2,
      color: "text-navy",
      bg:    "bg-navy/10",
    },
    {
      label: t("superAdmin.businesses.stats.active"),
      value: stats.active.toLocaleString("ar-MA"),
      icon:  CheckCircle2,
      color: "text-green-600",
      bg:    "bg-green-50",
    },
    {
      label: t("superAdmin.businesses.stats.inactive"),
      value: stats.disabled.toLocaleString("ar-MA"),
      icon:  Ban,
      color: "text-gray-500",
      bg:    "bg-gray-100",
    },
    {
      label: t("superAdmin.businesses.stats.expired"),
      value: stats.expired.toLocaleString("ar-MA"),
      icon:  AlertCircle,
      color: "text-red-500",
      bg:    "bg-red-50",
    },
    {
      label: t("superAdmin.businesses.stats.totalBookings"),
      value: stats.totalBookings.toLocaleString("ar-MA"),
      icon:  CalendarDays,
      color: "text-gold",
      bg:    "bg-gold/10",
    },
    {
      label: t("superAdmin.businesses.stats.totalRevenue"),
      value: `${stats.totalRevenue.toLocaleString("ar-MA")} د.م`,
      icon:  TrendingUp,
      color: "text-emerald-600",
      bg:    "bg-emerald-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="bg-white rounded-xl p-4 shadow-sm border border-border">
            <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
              <Icon size={20} className={card.color} />
            </div>
            <p className="text-xl font-bold text-dark leading-tight">{card.value}</p>
            <p className="text-xs text-gray-text mt-1">{card.label}</p>
          </div>
        );
      })}
    </div>
  );
}