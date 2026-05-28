"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import StatsCards          from "@/components/super-admin/owners/StatsCards";
import SearchBar           from "@/components/super-admin/owners/SearchBar";
import OwnersGrid          from "@/components/super-admin/owners/OwnersGrid";
import OwnerDetailsModal   from "@/components/super-admin/owners/OwnerDetailsModal";
import EditOwnerModal      from "@/components/super-admin/owners/EditOwnerModal";
import ResetPasswordModal  from "@/components/super-admin/owners/ResetPasswordModal";
import DeleteConfirmModal  from "@/components/super-admin/owners/DeleteConfirmModal";
import {
  EMPTY_FILTERS, calcStats, fromApi,
  type Owner, type FiltersState, type EditOwnerForm, type ApiOwner,
} from "@/components/super-admin/owners/types";
import { superAdminApi } from "@/lib/api";

type ModalState =
  | { type: "none" }
  | { type: "view";   owner: Owner }
  | { type: "edit";   owner: Owner }
  | { type: "reset";  owner: Owner }
  | { type: "delete"; owner: Owner };

export default function OwnersPage() {
  const [owners,  setOwners]  = useState<Owner[]>([]);
  const [filters, setFilters] = useState<FiltersState>(EMPTY_FILTERS);
  const [modal,   setModal]   = useState<ModalState>({ type: "none" });
  const [loading, setLoading] = useState(true);
  const [toast,   setToast]   = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // ── جلب البيانات ─────────────────────────────────────────────────────
  const fetchOwners = useCallback(async () => {
    try {
      setLoading(true);
      const res = await superAdminApi.owners.list();
      setOwners((res.data as ApiOwner[]).map(fromApi));
    } catch {
      showToast("تعذّر تحميل البيانات", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOwners(); }, [fetchOwners]);

  // ── Toast ─────────────────────────────────────────────────────────────
  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── فلترة القائمة ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return owners.filter((o) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const match =
          o.name.toLowerCase().includes(q)  ||
          o.email.toLowerCase().includes(q) ||
          o.phone.includes(q);
        if (!match) return false;
      }
      if (filters.status !== "all" && o.status !== filters.status) return false;
      return true;
    });
  }, [owners, filters]);

  // ── تعديل ────────────────────────────────────────────────────────────
  const handleEdit = async (data: EditOwnerForm) => {
    if (modal.type !== "edit") return;
    await superAdminApi.owners.update(modal.owner.id, data);
    setModal({ type: "none" });
    showToast("تم تحديث بيانات صاحب المحل بنجاح");
    fetchOwners();
  };

  // ── تفعيل / تعطيل ────────────────────────────────────────────────────
  const handleToggleStatus = async (owner: Owner) => {
    try {
      await superAdminApi.owners.toggleStatus(owner.id);
      const newStatus = owner.status === "active" ? "disabled" : "active";
      setOwners((prev) => prev.map((o) => o.id === owner.id ? { ...o, status: newStatus } : o));
      showToast(newStatus === "active" ? "تم تفعيل الحساب بنجاح" : "تم تعطيل الحساب بنجاح");
    } catch {
      showToast("تعذّر تغيير حالة الحساب", "error");
    }
  };

  // ── إعادة تعيين كلمة المرور ──────────────────────────────────────────
  const handleResetPassword = async (password: string) => {
    if (modal.type !== "reset") return;
    await superAdminApi.owners.resetPassword(modal.owner.id, password);
    setModal({ type: "none" });
    showToast("تم تعيين كلمة المرور الجديدة بنجاح");
  };

  // ── حذف ──────────────────────────────────────────────────────────────
  const handleDelete = async (owner: Owner) => {
    try {
      await superAdminApi.owners.delete(owner.id);
      setOwners((prev) => prev.filter((o) => o.id !== owner.id));
      setModal({ type: "none" });
      showToast("تم حذف الحساب والمحل المرتبط به بنجاح");
    } catch {
      showToast("تعذّر حذف الحساب", "error");
    }
  };

  const stats = useMemo(() => calcStats(owners), [owners]);

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-5">

      {/* ── رأس الصفحة ── */}
      <div>
        <div className="flex items-center gap-1.5 text-[11px] text-gray-text mb-0.5">
          <span>الرئيسية</span>
          <span>/</span>
          <span className="text-gold font-medium">أصحاب المحلات</span>
        </div>
        <h1 className="text-[22px] font-bold text-dark">أصحاب المحلات</h1>
        <p className="text-sm text-gray-text mt-0.5">عرض وإدارة حسابات أصحاب محلات وقاعات الأفراح</p>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* ── الإحصائيات ── */}
      <StatsCards stats={stats} />

      {/* ── البحث والفلتر ── */}
      <SearchBar
        filters={filters}
        onChange={(p) => setFilters((prev) => ({ ...prev, ...p }))}
        onReset={() => setFilters(EMPTY_FILTERS)}
      />

      {/* ── الشبكة أو التحميل ── */}
      {loading ? (
        <div className="bg-white rounded-xl border border-border shadow-sm p-16 flex items-center justify-center gap-3">
          <Loader2 size={24} className="animate-spin text-gold" />
          <p className="text-gray-text text-sm">جارِ تحميل أصحاب المحلات...</p>
        </div>
      ) : (
        <OwnersGrid
          owners={filtered}
          onView={         (o) => setModal({ type: "view",   owner: o })}
          onEdit={         (o) => setModal({ type: "edit",   owner: o })}
          onToggleStatus={ (o) => handleToggleStatus(o)}
          onResetPass={    (o) => setModal({ type: "reset",  owner: o })}
          onLoginAs={      (o) => showToast(`الدخول كمستخدم لـ "${o.name}" — ميزة مستقبلية`, "error")}
          onDelete={       (o) => setModal({ type: "delete", owner: o })}
        />
      )}

      {/* ── المودالات ── */}
      {modal.type === "view" && (
        <OwnerDetailsModal owner={modal.owner} onClose={() => setModal({ type: "none" })} />
      )}
      {modal.type === "edit" && (
        <EditOwnerModal owner={modal.owner} onSave={handleEdit} onCancel={() => setModal({ type: "none" })} />
      )}
      {modal.type === "reset" && (
        <ResetPasswordModal owner={modal.owner} onSave={handleResetPassword} onCancel={() => setModal({ type: "none" })} />
      )}
      {modal.type === "delete" && (
        <DeleteConfirmModal owner={modal.owner} onConfirm={() => handleDelete(modal.owner)} onCancel={() => setModal({ type: "none" })} />
      )}

    </div>
  );
}