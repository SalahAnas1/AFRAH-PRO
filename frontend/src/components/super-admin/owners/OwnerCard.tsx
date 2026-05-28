"use client";

import { MoreVertical, Eye, Store, MapPin, Phone, Mail, Calendar } from "lucide-react";
import type { Owner } from "./types";
import { STATUS_CONFIG, avatarColor, formatDate } from "./types";

interface Props {
  owner:       Owner;
  onView:      () => void;
  onMenuOpen:  (rect: DOMRect) => void;
  isMenuOpen:  boolean;
}

export default function OwnerCard({ owner, onView, onMenuOpen, isMenuOpen }: Props) {
  const statusCfg = STATUS_CONFIG[owner.status];
  const color     = avatarColor(owner.name);
  const initial   = owner.name.charAt(0);

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow flex flex-col">

      {/* رأس البطاقة */}
      <div className="p-5 pb-4 flex items-start gap-3">
        {/* الأفاتار */}
        <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center flex-shrink-0`}>
          <span className="text-white font-bold text-lg">{initial}</span>
        </div>

        {/* الاسم + الحالة */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-dark text-base truncate">{owner.name}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${statusCfg.className}`}>
              {statusCfg.label}
            </span>
          </div>
          {owner.business && (
            <div className="flex items-center gap-1 mt-0.5">
              <Store size={11} className="text-gold flex-shrink-0" />
              <span className="text-xs text-gold font-medium truncate">{owner.business.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* التفاصيل */}
      <div className="px-5 pb-4 space-y-2 flex-1">
        <InfoRow icon={Mail}     value={owner.email || "—"} />
        <InfoRow icon={Phone}    value={owner.phone || "—"} />
        {owner.business?.city && (
          <InfoRow icon={MapPin} value={owner.business.city} />
        )}
        <InfoRow icon={Calendar} value={`تاريخ الإنشاء: ${formatDate(owner.createdAt)}`} />
      </div>

      {/* أسفل البطاقة */}
      <div className="px-5 py-3 border-t border-border flex items-center justify-between gap-2">
        <button
          onClick={onView}
          className="flex items-center gap-1.5 text-sm text-gray-text hover:text-gold transition-colors"
        >
          <Eye size={14} />
          عرض
        </button>

        <button
          onClick={(e) => onMenuOpen(e.currentTarget.getBoundingClientRect())}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
            isMenuOpen
              ? "bg-gold/15 text-gold"
              : "hover:bg-cream-light text-gray-text hover:text-dark"
          }`}
        >
          <MoreVertical size={16} />
        </button>
      </div>

    </div>
  );
}

function InfoRow({ icon: Icon, value }: { icon: React.ElementType; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={13} className="text-gray-text flex-shrink-0" />
      <span className="text-xs text-gray-text truncate">{value}</span>
    </div>
  );
}