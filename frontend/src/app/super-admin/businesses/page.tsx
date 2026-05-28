"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import StatsCards           from "@/components/super-admin/businesses/StatsCards";
import FiltersBar           from "@/components/super-admin/businesses/FiltersBar";
import BusinessesTable      from "@/components/super-admin/businesses/BusinessesTable";
import AddBusinessModal     from "@/components/super-admin/businesses/AddBusinessModal";
import BusinessDetailsModal from "@/components/super-admin/businesses/BusinessDetailsModal";
import DeleteConfirmModal   from "@/components/super-admin/businesses/DeleteConfirmModal";
import {
  EMPTY_FILTERS, calcStats, fromApi,
  type Business, type FiltersState, type NewBusinessForm, type ApiBusiness,
} from "@/components/super-admin/businesses/types";
import { superAdminApi } from "@/lib/api";

type ModalState =
  | { type: "none" }
  | { type: "add" }
  | { type: "edit";   business: Business }
  | { type: "view";   business: Business }
  | { type: "delete"; business: Business };

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filters,    setFilters]    = useState<FiltersState>(EMPTY_FILTERS);
  const [modal,      setModal]      = useState<ModalState>({ type: "none" });
  const [loading,    setLoading]    = useState(true);
  const [toast,      setToast]      = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // ── جلب القائمة من API ────────────────────────────────────────────────
  const fetchBusinesses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await superAdminApi.businesses.list();
      setBusinesses((res.data as ApiBusiness[]).map(fromApi));
    } catch {
      showToast("تعذّر تحميل البيانات. تأكد من تسجيل الدخول كسوبر أدمن.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBusinesses(); }, [fetchBusinesses]);

  // ── رسالة Toast مؤقتة ────────────────────────────────────────────────
  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── فلترة القائمة ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return businesses.filter((b) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!b.name.toLowerCase().includes(q) && !b.owner.toLowerCase().includes(q)) return false;
      }
      if (filters.city   !== "الكل" && b.city   !== filters.city)   return false;
      if (filters.status !== "all"  && b.status  !== filters.status) return false;
      if (filters.plan   !== "الكل" && b.plan    !== filters.plan)   return false;
      return true;
    });
  }, [businesses, filters]);

  // ── إضافة محل جديد ───────────────────────────────────────────────────
  const handleAdd = async (data: NewBusinessForm) => {
    await superAdminApi.businesses.create({
      name:           data.name,
      phone:          data.phone,
      email:          data.email,
      city:           data.city,
      address:        data.address,
      plan:           data.plan,
      plan_expiry:    data.planExpiry || null,
      status:         data.status,
      owner_name:     data.ownerName,
      owner_email:    data.ownerEmail,
      owner_phone:    data.ownerPhone,
      owner_password: data.ownerPassword,
    });
    setModal({ type: "none" });
    showToast("تم إنشاء المحل وحساب المدير بنجاح");
    fetchBusinesses();
  };

  // ── تعديل بيانات محل ─────────────────────────────────────────────────
  const handleEdit = async (data: NewBusinessForm) => {
    if (modal.type !== "edit") return;
    await superAdminApi.businesses.update(modal.business.id, {
      name:        data.name,
      phone:       data.phone,
      email:       data.email,
      city:        data.city,
      address:     data.address,
      plan:        data.plan,
      plan_expiry: data.planExpiry || null,
      status:      data.status,
      owner_name:  data.ownerName,
      owner_email: data.ownerEmail,
      owner_phone: data.ownerPhone,
    });
    setModal({ type: "none" });
    showToast("تم تحديث بيانات المحل بنجاح");
    fetchBusinesses();
  };

  // ── تفعيل / تعطيل ────────────────────────────────────────────────────
  const handleToggleStatus = async (b: Business) => {
    try {
      await superAdminApi.businesses.toggleStatus(b.id);
      const newStatus = b.status === "active" || b.status === "expiring_soon" ? "disabled" : "active";
      setBusinesses((prev) => prev.map((x) => x.id === b.id ? { ...x, status: newStatus } : x));
      showToast(newStatus === "active" ? "تم تفعيل المحل بنجاح" : "تم تعطيل المحل بنجاح");
    } catch {
      showToast("تعذّر تغيير حالة المحل", "error");
    }
  };

  // ── حذف ──────────────────────────────────────────────────────────────
  const handleDelete = async (b: Business) => {
    try {
      await superAdminApi.businesses.delete(b.id);
      setBusinesses((prev) => prev.filter((x) => x.id !== b.id));
      setModal({ type: "none" });
      showToast("تم حذف المحل وحساب المدير بنجاح");
    } catch {
      showToast("تعذّر حذف المحل", "error");
    }
  };

  const stats = useMemo(() => calcStats(businesses), [businesses]);

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-5">

      {/* ── رأس الصفحة ── */}
      <div>
        <div className="flex items-center gap-1.5 text-[11px] text-gray-text mb-0.5">
          <span>الرئيسية</span>
          <span>/</span>
          <span className="text-gold font-medium">المحلات</span>
        </div>
        <h1 className="text-[22px] font-bold text-dark">المحلات</h1>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
          toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* ── بطاقات الإحصائيات ── */}
      <StatsCards stats={stats} />

      {/* ── الفلاتر ── */}
      <FiltersBar
        filters={filters}
        onChange={(partial) => setFilters((prev) => ({ ...prev, ...partial }))}
        onReset={() => setFilters(EMPTY_FILTERS)}
        onAdd={() => setModal({ type: "add" })}
        onExport={() => showToast("تصدير البيانات — سيتم ربطه قريباً", "error")}
      />

      {/* ── حالة التحميل ── */}
      {loading ? (
        <div className="bg-white rounded-xl border border-border shadow-sm p-16 flex items-center justify-center gap-3">
          <Loader2 size={24} className="animate-spin text-gold" />
          <p className="text-gray-text text-sm">جارِ تحميل المحلات...</p>
        </div>
      ) : (
        <BusinessesTable
          businesses={filtered}
          onView={         (b) => setModal({ type: "view",   business: b })}
          onEdit={         (b) => setModal({ type: "edit",   business: b })}
          onToggleStatus={ (b) => handleToggleStatus(b)}
          onDelete={       (b) => setModal({ type: "delete", business: b })}
          onNotify={       (b) => showToast(`تم إرسال إشعار لصاحب محل "${b.name}"`)}
          onExtend={       (b) => showToast(`تمديد اشتراك "${b.name}" — سيتم ربطه قريباً`, "error")}
          onLoginAs={      (b) => showToast(`الدخول كمستخدم لـ "${b.name}" — ميزة مستقبلية`, "error")}
        />
      )}

      {/* ── المودالات ── */}

      {modal.type === "add" && (
        <AddBusinessModal
          onSave={handleAdd}
          onCancel={() => setModal({ type: "none" })}
        />
      )}

      {modal.type === "edit" && (
        <AddBusinessModal
          title="تعديل بيانات المحل"
          initial={{
            name:       modal.business.name,
            phone:      modal.business.phone,
            email:      modal.business.email,
            city:       modal.business.city,
            address:    modal.business.address,
            ownerName:  modal.business.owner,
            ownerEmail: modal.business.ownerEmail,
            ownerPhone: modal.business.ownerPhone,
            plan:       modal.business.plan,
            planExpiry: modal.business.planExpiry,
            status:     modal.business.status,
          }}
          onSave={handleEdit}
          onCancel={() => setModal({ type: "none" })}
        />
      )}

      {modal.type === "view" && (
        <BusinessDetailsModal
          business={modal.business}
          onClose={() => setModal({ type: "none" })}
        />
      )}

      {modal.type === "delete" && (
        <DeleteConfirmModal
          business={modal.business}
          onConfirm={() => handleDelete(modal.business)}
          onCancel={() => setModal({ type: "none" })}
        />
      )}

    </div>
  );
}