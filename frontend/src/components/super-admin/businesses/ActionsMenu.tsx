"use client";
import { useLanguage } from "@/context/LanguageContext";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Eye, Pencil, Power, Bell, LogIn, Trash2, CalendarPlus } from "lucide-react";
import type { Business } from "./types";

interface Props {
  business:       Business;
  anchorRect:     DOMRect;
  onView:         () => void;
  onEdit:         () => void;
  onToggleStatus: () => void;
  onExtend:       () => void;
  onNotify:       () => void;
  onLoginAs:      () => void;
  onDelete:       () => void;
  onClose:        () => void;
}

export default function ActionsMenu({
  business, anchorRect, onView, onEdit, onToggleStatus,
  onExtend, onNotify, onLoginAs, onDelete, onClose,
}: Props) {
  const { t } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);

  // إغلاق عند الضغط خارج القائمة
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const isActive = business.status === "active" || business.status === "expiring_soon";

  // حساب موضع القائمة: تحت الزر، مع منع الخروج عن حدود الشاشة
  const MENU_WIDTH  = 208;
  const MENU_HEIGHT = 320;
  const GAP         = 4;

  const top = anchorRect.bottom + GAP + window.scrollY;

  // محاذاة اليمين مع يمين الزر، مع منع الخروج يساراً
  let left = anchorRect.right - MENU_WIDTH;
  if (left < 4) left = 4;

  // منع الخروج من أسفل الشاشة
  const fitsBelow = anchorRect.bottom + MENU_HEIGHT + GAP < window.innerHeight;
  const finalTop  = fitsBelow
    ? anchorRect.bottom + GAP + window.scrollY
    : anchorRect.top - MENU_HEIGHT - GAP + window.scrollY;

  const row = (onClick: () => void, icon: React.ReactNode, label: string, cls = "text-dark hover:bg-cream-light") => (
    <button
      onClick={() => { onClick(); onClose(); }}
      className={`flex items-center gap-2.5 w-full px-4 py-2.5 transition-colors text-sm ${cls}`}
    >
      {icon}
      {label}
    </button>
  );

  return createPortal(
    <div
      ref={ref}
      style={{ position: "absolute", top: finalTop, left, width: MENU_WIDTH, zIndex: 9999 }}
      className="bg-white rounded-xl shadow-xl border border-border py-1"
    >
      {row(onView, <Eye       size={15} className="text-gray-text" />, t("superAdmin.businesses.actions.viewDetails"))}
      {row(onEdit, <Pencil    size={15} className="text-gray-text" />, t("common.edit"))}

      <div className="border-t border-border my-1" />

      {isActive
        ? row(onToggleStatus, <Power size={15} />, t("superAdmin.businesses.actions.disable"),  "text-orange-600 hover:bg-orange-50")
        : row(onToggleStatus, <Power size={15} />, t("superAdmin.businesses.actions.enable"),  "text-green-600 hover:bg-green-50")
      }
      {row(onExtend, <CalendarPlus size={15} className="text-gray-text" />, t("superAdmin.businesses.actions.extendSub"))}

      <div className="border-t border-border my-1" />

      {row(onNotify, <Bell  size={15} className="text-gray-text" />, t("superAdmin.businesses.actions.sendNotif"))}
      {row(onLoginAs, <LogIn size={15} />, t("superAdmin.businesses.actions.loginAs"), "text-blue-600 hover:bg-blue-50")}

      <div className="border-t border-border my-1" />

      {row(onDelete, <Trash2 size={15} />, t("superAdmin.businesses.actions.delete"), "text-red-500 hover:bg-red-50")}
    </div>,
    document.body
  );
}