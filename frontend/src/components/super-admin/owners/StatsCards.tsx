"use client";
import { useLanguage } from "@/context/LanguageContext";

import { Users, UserCheck, UserX } from "lucide-react";
import type { StatsData } from "./types";

export default function StatsCards({
  stats }: { stats: StatsData }) {
  const { t } = useLanguage();
  const cards = [
    { label: t("superAdmin.owners.stats.total"), value: stats.total,    icon: Users,      color: "text-navy",        bg: "bg-navy/10"   },
    { label: t("superAdmin.owners.stats.active"),      value: stats.active,   icon: UserCheck,  color: "text-green-600",   bg: "bg-green-50"  },
    { label: t("superAdmin.owners.stats.inactive"),     value: stats.disabled, icon: UserX,      color: "text-gray-500",    bg: "bg-gray-100"  },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="bg-white rounded-xl p-4 shadow-sm border border-border flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={22} className={card.color} />
            </div>
            <div>
              <p className="text-2xl font-bold text-dark">{card.value}</p>
              <p className="text-xs text-gray-text mt-0.5">{card.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}