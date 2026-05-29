"use client";

import { useState, useEffect, useCallback } from "react";
import Topbar from "@/components/layout/Topbar";
import { Worker, PaginatedResponse } from "@/types";
import { workersApi } from "@/lib/api";
import {
  Plus, Search, Pencil, Trash2, X, Loader2,
  ChevronLeft, ChevronRight, Upload, Phone, UserCircle2,
} from "lucide-react";

const STORAGE_URL = (process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:8000') + '/storage';

const ROLES = [
  "مصور", "منسق ديكور", "طاهي", "نادل", "مسؤول صوتيات",
  "موسيقي", "حارس أمن", "عامل نظافة", "مدير قاعة", "مساعد إداري",
];

// ════════════════════════════════════════════════════════════════════════════
//  نافذة الإضافة / التعديل
// ════════════════════════════════════════════════════════════════════════════
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

interface WorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingWorker: Worker | null;
}

function WorkerModal({ isOpen, onClose, onSave, editingWorker }: WorkerModalProps) {
  const [name, setName]             = useState("");
  const [phone, setPhone]           = useState("");
  const [role, setRole]             = useState("");
  const [customRole, setCustomRole] = useState("");
  const [image, setImage]           = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  const isCustomRole = role === "__custom__";
  const finalRole = isCustomRole ? customRole : role;

  useEffect(() => {
    if (editingWorker) {
      setName(editingWorker.name);
      setPhone(editingWorker.phone ?? "");
      setImagePreview(
        editingWorker.image ? `${STORAGE_URL}/${editingWorker.image}` : null
      );
      if (editingWorker.role && ROLES.includes(editingWorker.role)) {
        setRole(editingWorker.role);
        setCustomRole("");
      } else if (editingWorker.role) {
        setRole("__custom__");
        setCustomRole(editingWorker.role);
      } else {
        setRole(""); setCustomRole("");
      }
    } else {
      setName(""); setPhone(""); setRole(""); setCustomRole(""); setImagePreview(null);
    }
    setImage(null);
    setError("");
  }, [editingWorker, isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE) {
      setError("حجم الصورة كبير جداً — الحد الأقصى 5MB");
      e.target.value = "";
      return;
    }
    setError("");
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("phone", phone);
      formData.append("role", finalRole);
      if (image) formData.append("image", image);

      if (editingWorker) {
        await workersApi.update(editingWorker.id, formData);
      } else {
        await workersApi.create(formData);
      }
      onSave();
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errors = axiosErr?.response?.data?.errors;
      if (errors) {
        setError(Object.values(errors)[0]?.[0] ?? "حدث خطأ");
      } else {
        setError(axiosErr?.response?.data?.message ?? "حدث خطأ، حاول مرة أخرى");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl max-h-[92vh] overflow-y-auto">

        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-lg font-bold text-dark">
            {editingWorker ? "تعديل بيانات العامل" : "إضافة عامل جديد"}
          </h3>
          <button onClick={onClose} className="text-gray-text hover:text-dark transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>
          )}

          {/* الصورة الشخصية */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-20 rounded-full bg-cream border-2 border-border overflow-hidden flex items-center justify-center">
              {imagePreview
                ? <img src={imagePreview} alt="avatar" className="w-full h-full object-cover" />
                : <UserCircle2 size={40} className="text-border" />}
            </div>
            <label className="cursor-pointer text-sm text-gold hover:text-dark transition-colors flex items-center gap-1.5">
              <Upload size={14} />
              <span>رفع صورة شخصية</span>
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>

          {/* الاسم */}
          <div>
            <label className="label">الاسم الكامل <span className="text-red-500">*</span></label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="أدخل اسم العامل" className="input-field" required />
          </div>

          {/* الهاتف */}
          <div>
            <label className="label">رقم الهاتف</label>
            <div className="relative">
              <Phone size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-text" />
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="06xxxxxxxx" className="input-field pr-8" />
            </div>
          </div>

          {/* المنصب */}
          <div>
            <label className="label">المنصب</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="input-field">
              <option value="">— اختر —</option>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              <option value="__custom__">أخرى...</option>
            </select>
          </div>

          {isCustomRole && (
            <div>
              <label className="label">اكتب المنصب</label>
              <input type="text" value={customRole} onChange={(e) => setCustomRole(e.target.value)}
                placeholder="مثال: مصمم إضاءة" className="input-field" autoFocus />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-2.5 disabled:opacity-60">
              {loading
                ? <><Loader2 size={16} className="animate-spin" /><span>جارِ الحفظ...</span></>
                : <span>{editingWorker ? "حفظ التعديلات" : "إضافة العامل"}</span>}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  الصفحة الرئيسية
// ════════════════════════════════════════════════════════════════════════════
export default function WorkersPage() {
  const [workers, setWorkers]           = useState<PaginatedResponse<Worker> | null>(null);
  const [loading, setLoading]           = useState(true);
  const [searchInput, setSearchInput]   = useState("");
  const [search, setSearch]             = useState("");
  const [page, setPage]                 = useState(1);
  const [modalOpen, setModalOpen]       = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [deletingId, setDeletingId]     = useState<number | null>(null);

  const fetchWorkers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await workersApi.list({ search: search || undefined, page, per_page: 10 });
      setWorkers(res.data);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchWorkers(); }, [fetchWorkers]);

  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا العامل؟")) return;
    setDeletingId(id);
    try {
      await workersApi.delete(id);
      fetchWorkers();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <Topbar title="العمال" breadcrumb={[{ label: "الرئيسية" }, { label: "العمال" }]} />

      <div className="p-3 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <button onClick={() => { setEditingWorker(null); setModalOpen(true); }} className="btn-primary">
            <Plus size={16} />
            <span>إضافة عامل</span>
          </button>
        </div>

        {/* البحث */}
        <div className="card mb-4">
          <div className="relative w-full sm:max-w-sm">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-text" />
            <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              placeholder="ابحث عن عامل..." className="input-field pr-8" />
          </div>
        </div>

        {/* الجدول */}
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[480px]">
            <thead className="bg-cream border-b border-border">
              <tr>
                <th className="text-right text-sm font-semibold text-dark px-4 py-3">العامل</th>
                <th className="text-right text-sm font-semibold text-dark px-4 py-3">الهاتف</th>
                <th className="text-right text-sm font-semibold text-dark px-4 py-3">المنصب</th>
                <th className="text-right text-sm font-semibold text-dark px-4 py-3">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center py-20"><Loader2 size={32} className="animate-spin text-gold mx-auto" /></td></tr>
              ) : workers?.data.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-20 text-gray-text">لا يوجد عمال</td></tr>
              ) : (
                workers?.data.map((worker) => (
                  <tr key={worker.id} className="border-b border-border last:border-0 hover:bg-cream/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-cream border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {worker.image
                            ? <img src={`${STORAGE_URL}/${worker.image}`} alt={worker.name} className="w-full h-full object-cover" />
                            : <UserCircle2 size={22} className="text-gray-text" />}
                        </div>
                        <span className="font-semibold text-dark text-sm">{worker.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-text">
                      {worker.phone
                        ? <a href={`tel:${worker.phone}`} className="hover:text-gold transition-colors">{worker.phone}</a>
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-dark">{worker.role ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditingWorker(worker); setModalOpen(true); }}
                          className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-gray-text hover:border-gold hover:text-gold transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(worker.id)} disabled={deletingId === worker.id}
                          className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-gray-text hover:border-red-400 hover:text-red-500 transition-colors disabled:opacity-50">
                          {deletingId === worker.id
                            ? <Loader2 size={14} className="animate-spin" />
                            : <Trash2 size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* Pagination */}
        {workers && workers.last_page > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-text">
              من {(workers.current_page - 1) * workers.per_page + 1} إلى{" "}
              {Math.min(workers.current_page * workers.per_page, workers.total)} من{" "}
              {workers.total} عامل
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={workers.current_page === 1}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-gray-text hover:border-gold hover:text-gold transition-colors disabled:opacity-40">
                <ChevronRight size={16} />
              </button>
              {Array.from({ length: workers.last_page }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - workers.current_page) <= 2)
                .map((p) => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      p === workers.current_page ? "bg-gold text-navy" : "border border-border text-gray-text hover:border-gold hover:text-gold"
                    }`}>
                    {p}
                  </button>
                ))}
              <button onClick={() => setPage((p) => Math.min(workers.last_page, p + 1))} disabled={workers.current_page === workers.last_page}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-gray-text hover:border-gold hover:text-gold transition-colors disabled:opacity-40">
                <ChevronLeft size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <WorkerModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingWorker(null); }}
        onSave={fetchWorkers}
        editingWorker={editingWorker}
      />
    </div>
  );
}