"use client";

import { X, Phone, Mail, MapPin, CalendarDays, Clock } from "lucide-react";
import type { Business } from "./types";
import { STATUS_CONFIG, PLAN_CONFIG, formatDate } from "./types";

interface Props {
  business: Business;
  onClose:  () => void;
}

export default function BusinessDetailsModal({ business, onClose }: Props) {
  const statusCfg = STATUS_CONFIG[business.status];
  const planCfg   = PLAN_CONFIG[business.plan];
  const profit    = business.revenue - business.expenses;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-2xl shadow-2xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <h2 className="font-bold text-dark text-lg">تفاصيل المحل</h2>
          <button onClick={onClose} className="text-gray-text hover:text-dark transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* بطاقة المحل */}
          <div className="flex items-center gap-4 p-4 bg-cream-light rounded-xl">
            <div className="w-16 h-16 rounded-2xl bg-navy/10 flex items-center justify-center flex-shrink-0">
              <span className="text-navy font-bold text-2xl">{business.name.charAt(0)}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center flex-wrap gap-2 mb-1">
                <h3 className="text-xl font-bold text-dark">{business.name}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCfg.className}`}>
                  {statusCfg.label}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${planCfg.className}`}>
                  {business.plan}
                </span>
              </div>
              <p className="text-gray-text text-sm">المالك: <span className="text-dark font-medium">{business.owner}</span></p>
            </div>
          </div>

          {/* معلومات التواصل */}
          <div className="grid grid-cols-2 gap-3">
            <InfoItem icon={Phone}       label="الهاتف"          value={business.phone}           />
            <InfoItem icon={Mail}        label="البريد"           value={business.email}           />
            <InfoItem icon={MapPin}      label="المدينة"          value={business.city}            />
            <InfoItem icon={MapPin}      label="العنوان"          value={business.address}         />
            <InfoItem icon={CalendarDays} label="انتهاء الاشتراك" value={formatDate(business.planExpiry)} />
            <InfoItem icon={Clock}       label="آخر نشاط"         value={business.lastActivity}   />
          </div>

          {/* إحصائيات النشاط */}
          <div>
            <h4 className="text-sm font-bold text-dark mb-3">إحصائيات النشاط</h4>
            <div className="grid grid-cols-4 gap-3">
              <MiniStat label="الحجوزات"  value={business.bookings} emoji="📅" />
              <MiniStat label="المنتجات"  value={business.products} emoji="📦" />
              <MiniStat label="الخدمات"   value={business.services} emoji="✨" />
              <MiniStat label="العمال"    value={business.workers}  emoji="👷" />
            </div>
          </div>

          {/* الملخص المالي */}
          <div>
            <h4 className="text-sm font-bold text-dark mb-3">الملخص المالي</h4>
            <div className="grid grid-cols-3 gap-3">
              <FinCard
                label="إجمالي الإيرادات"
                value={business.revenue}
                color="text-green-600"
                bg="bg-green-50"
              />
              <FinCard
                label="إجمالي المصاريف"
                value={business.expenses}
                color="text-red-500"
                bg="bg-red-50"
              />
              <FinCard
                label="صافي الربح"
                value={profit}
                color={profit >= 0 ? "text-emerald-600" : "text-red-600"}
                bg={profit >= 0 ? "bg-emerald-50" : "bg-red-50"}
              />
            </div>
          </div>

          {/* آخر النشاطات */}
          <div>
            <h4 className="text-sm font-bold text-dark mb-3">آخر النشاطات</h4>
            <div className="space-y-2">
              {business.activities.map((act) => (
                <div key={act.id} className="flex items-center gap-3 p-3 bg-cream-light rounded-xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
                  <p className="flex-1 text-sm text-dark">{act.text}</p>
                  <span className="text-xs text-gray-text flex-shrink-0">{act.date}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex-shrink-0">
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

// ── مكوّنات مساعدة ──────────────────────────────────────────────────────────

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 p-3 bg-cream-light rounded-xl">
      <Icon size={15} className="text-gold flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-gray-text">{label}</p>
        <p className="text-sm font-medium text-dark truncate">{value}</p>
      </div>
    </div>
  );
}

function MiniStat({ label, value, emoji }: { label: string; value: number; emoji: string }) {
  return (
    <div className="bg-cream-light rounded-xl p-3 text-center">
      <p className="text-lg mb-0.5">{emoji}</p>
      <p className="text-lg font-bold text-dark">{value}</p>
      <p className="text-xs text-gray-text">{label}</p>
    </div>
  );
}

function FinCard({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div className={`${bg} rounded-xl p-3 text-center`}>
      <p className={`text-base font-bold ${color}`}>{value.toLocaleString("ar-MA")}</p>
      <p className="text-xs text-gray-text">د.م</p>
      <p className="text-xs text-gray-text mt-1">{label}</p>
    </div>
  );
}