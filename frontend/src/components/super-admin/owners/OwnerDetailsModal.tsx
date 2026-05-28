"use client";

import { X, Mail, Phone, Store, MapPin, Calendar, CreditCard } from "lucide-react";
import type { Owner } from "./types";
import { STATUS_CONFIG, avatarColor, formatDate } from "./types";

const PLAN_COLORS: Record<string, string> = {
  Basic:      "bg-blue-50 text-blue-600",
  Premium:    "bg-amber-50 text-amber-600",
  Enterprise: "bg-purple-50 text-purple-600",
};

interface Props {
  owner:   Owner;
  onClose: () => void;
}

export default function OwnerDetailsModal({ owner, onClose }: Props) {
  const statusCfg = STATUS_CONFIG[owner.status];
  const color     = avatarColor(owner.name);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl max-h-[92vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-bold text-dark text-lg">تفاصيل صاحب المحل</h2>
          <button onClick={onClose} className="text-gray-text hover:text-dark transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">

          {/* الأفاتار + الاسم */}
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl ${color} flex items-center justify-center flex-shrink-0`}>
              <span className="text-white font-bold text-2xl">{owner.name.charAt(0)}</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-dark">{owner.name}</h3>
              <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCfg.className}`}>
                {statusCfg.label}
              </span>
            </div>
          </div>

          {/* معلومات التواصل */}
          <div className="space-y-3">
            <Row icon={Mail}     label="البريد الإلكتروني" value={owner.email || "—"} />
            <Row icon={Phone}    label="رقم الهاتف"         value={owner.phone || "—"} />
            <Row icon={Calendar} label="تاريخ الإنشاء"      value={formatDate(owner.createdAt)} />
          </div>

          {/* معلومات المحل */}
          {owner.business ? (
            <div className="bg-cream-light rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-gray-text">المحل المرتبط</p>
              <Row icon={Store}   label="اسم المحل" value={owner.business.name} />
              {owner.business.city && (
                <Row icon={MapPin} label="المدينة"  value={owner.business.city} />
              )}
              <div className="flex items-center gap-2">
                <CreditCard size={14} className="text-gray-text flex-shrink-0" />
                <span className="text-xs text-gray-text">الباقة:</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_COLORS[owner.business.plan] ?? "bg-gray-100 text-gray-600"}`}>
                  {owner.business.plan}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-orange-50 rounded-xl p-4 text-center">
              <p className="text-xs text-orange-600">لا يوجد محل مرتبط بهذا الحساب</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="w-full py-2.5 border border-border rounded-xl text-sm text-dark hover:bg-cream-light transition-colors"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon size={14} className="text-gray-text flex-shrink-0" />
      <span className="text-xs text-gray-text">{label}:</span>
      <span className="text-sm text-dark font-medium">{value}</span>
    </div>
  );
}