"use client";
import { useLanguage } from "@/context/LanguageContext";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Eye, Pencil, Power, KeyRound, LogIn, Trash2 } from "lucide-react";
import type { Owner } from "./types";

interface Props {
  owner:          Owner;
  anchorRect:     DOMRect;
  onView:         () => void;
  onEdit:         () => void;
  onToggleStatus: () => void;
  onResetPass:    () => void;
  onLoginAs:      () => void;
  onDelete:       () => void;
  onClose:        () => void;
}

export default function ActionsMenu({
  owner, anchorRect, onView, onEdit, onToggleStatus,
  onResetPass, onLoginAs, onDelete, onClose,
}: Props) {
  const { t } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const MENU_WIDTH  = 208;
  const MENU_HEIGHT = 290;
  const GAP         = 4;

  let left = anchorRect.right - MENU_WIDTH;
  if (left < 4) left = 4;

  const fitsBelow = anchorRect.bottom + MENU_HEIGHT + GAP < window.innerHeight;
  const top = fitsBelow
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

  const isActive = owner.status === "active";

  return createPortal(
    <div
      ref={ref}
      style={{ position: "absolute", top, left, width: MENU_WIDTH, zIndex: 9999 }}
      className="bg-white rounded-xl shadow-xl border border-border py-1"
    >
      {row(onView, <Eye    size={15} className="text-gray-text" />, t("superAdmin.owners.actions.viewDetails"))}
      {row(onEdit, <Pencil size={15} className="text-gray-text" />, t("common.edit"))}

      <div className="border-t border-border my-1" />

      {isActive
        ? row(onToggleStatus, <Power size={15} />, t("superAdmin.owners.actions.disable"), "text-orange-600 hover:bg-orange-50")
        : row(onToggleStatus, <Power size={15} />, t("superAdmin.owners.actions.enable"), "text-green-600 hover:bg-green-50")
      }
      {row(onResetPass, <KeyRound size={15} className="text-gray-text" />, t("superAdmin.owners.actions.resetPassword"))}

      <div className="border-t border-border my-1" />

      {row(onLoginAs, <LogIn  size={15} />, t("superAdmin.owners.actions.loginAs"), "text-blue-600 hover:bg-blue-50")}

      <div className="border-t border-border my-1" />

      {row(onDelete, <Trash2 size={15} />, t("common.delete"), "text-red-500 hover:bg-red-50")}
    </div>,
    document.body
  );
}