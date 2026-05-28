"use client";

import { useState } from "react";
import { MoreVertical } from "lucide-react";
import type { Business } from "./types";
import { STATUS_CONFIG, PLAN_CONFIG, formatDate } from "./types";
import ActionsMenu from "./ActionsMenu";

interface Props {
  businesses:     Business[];
  onView:         (b: Business) => void;
  onEdit:         (b: Business) => void;
  onToggleStatus: (b: Business) => void;
  onDelete:       (b: Business) => void;
  onNotify:       (b: Business) => void;
  onExtend:       (b: Business) => void;
  onLoginAs:      (b: Business) => void;
}

export default function BusinessesTable({
  businesses, onView, onEdit, onToggleStatus,
  onDelete, onNotify, onExtend, onLoginAs,
}: Props) {
  const [openMenu, setOpenMenu] = useState<{ id: number; rect: DOMRect } | null>(null);

  const toggleMenu = (biz: Business, e: React.MouseEvent<HTMLButtonElement>) => {
    if (openMenu?.id === biz.id) {
      setOpenMenu(null);
    } else {
      setOpenMenu({ id: biz.id, rect: e.currentTarget.getBoundingClientRect() });
    }
  };

  if (businesses.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-border shadow-sm p-16 text-center">
        <p className="text-2xl mb-2">🔍</p>
        <p className="text-gray-text text-sm">لا توجد محلات مطابقة للبحث</p>
      </div>
    );
  }

  const activeBiz = businesses.find((b) => b.id === openMenu?.id);

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-border bg-cream-light">
              <th className="text-right text-xs font-semibold text-gray-text px-4 py-3 whitespace-nowrap">الشعار</th>
              <th className="text-right text-xs font-semibold text-gray-text px-4 py-3 whitespace-nowrap">اسم المحل</th>
              <th className="text-right text-xs font-semibold text-gray-text px-4 py-3 whitespace-nowrap">المالك</th>
              <th className="text-right text-xs font-semibold text-gray-text px-4 py-3 whitespace-nowrap">المدينة</th>
              <th className="text-right text-xs font-semibold text-gray-text px-4 py-3 whitespace-nowrap">الحجوزات</th>
              <th className="text-right text-xs font-semibold text-gray-text px-4 py-3 whitespace-nowrap">الباقة</th>
              <th className="text-right text-xs font-semibold text-gray-text px-4 py-3 whitespace-nowrap">انتهاء الاشتراك</th>
              <th className="text-right text-xs font-semibold text-gray-text px-4 py-3 whitespace-nowrap">الحالة</th>
              <th className="text-right text-xs font-semibold text-gray-text px-4 py-3 whitespace-nowrap">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {businesses.map((biz) => {
              const statusCfg = STATUS_CONFIG[biz.status];
              const planCfg   = PLAN_CONFIG[biz.plan];
              return (
                <tr
                  key={biz.id}
                  className="border-b border-border/60 hover:bg-cream-light/50 transition-colors"
                >
                  {/* الشعار */}
                  <td className="px-4 py-3">
                    <div className="w-9 h-9 rounded-xl bg-navy/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-navy font-bold text-sm">{biz.name.charAt(0)}</span>
                    </div>
                  </td>

                  {/* اسم المحل */}
                  <td className="px-4 py-3">
                    <p className="font-semibold text-dark text-sm whitespace-nowrap">{biz.name}</p>
                    <p className="text-xs text-gray-text">{biz.email}</p>
                  </td>

                  {/* المالك */}
                  <td className="px-4 py-3">
                    <p className="text-sm text-dark whitespace-nowrap">{biz.owner}</p>
                    <p className="text-xs text-gray-text">{biz.ownerPhone}</p>
                  </td>

                  {/* المدينة */}
                  <td className="px-4 py-3 text-sm text-dark whitespace-nowrap">{biz.city}</td>

                  {/* الحجوزات */}
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold text-dark">{biz.bookings}</span>
                  </td>

                  {/* الباقة */}
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${planCfg.className}`}>
                      {biz.plan}
                    </span>
                  </td>

                  {/* انتهاء الاشتراك */}
                  <td className="px-4 py-3 text-sm text-dark whitespace-nowrap">
                    {formatDate(biz.planExpiry)}
                  </td>

                  {/* الحالة */}
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusCfg.className}`}>
                      {statusCfg.label}
                    </span>
                  </td>

                  {/* الإجراءات */}
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => toggleMenu(biz, e)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                        openMenu?.id === biz.id
                          ? "bg-gold/15 text-gold"
                          : "hover:bg-cream-light text-gray-text hover:text-dark"
                      }`}
                    >
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border bg-cream-light/50">
        <p className="text-xs text-gray-text">
          إجمالي النتائج: <span className="font-semibold text-dark">{businesses.length}</span> محل
        </p>
      </div>

      {/* القائمة عبر Portal — خارج حدود الـ table تماماً */}
      {openMenu && activeBiz && (
        <ActionsMenu
          business={activeBiz}
          anchorRect={openMenu.rect}
          onView={         () => onView(activeBiz)}
          onEdit={         () => onEdit(activeBiz)}
          onToggleStatus={ () => onToggleStatus(activeBiz)}
          onExtend={       () => onExtend(activeBiz)}
          onNotify={       () => onNotify(activeBiz)}
          onLoginAs={      () => onLoginAs(activeBiz)}
          onDelete={       () => onDelete(activeBiz)}
          onClose={        () => setOpenMenu(null)}
        />
      )}
    </div>
  );
}