"use client";

import { useState, useEffect, useCallback } from "react";
import Topbar from "@/components/layout/Topbar";
import { Invoice, InvoiceCategory, PaginatedResponse } from "@/types";
import { invoicesApi } from "@/lib/api";
import {
  Plus, Search, Pencil, Trash2, X, Loader2,
  ChevronLeft, ChevronRight, FileText, Check,
} from "lucide-react";

const STATUS_MAP = {
  paid:   { label: "مدفوعة",     classes: "bg-green-100 text-green-700" },
  unpaid: { label: "غير مدفوعة", classes: "bg-red-100 text-red-700" },
};

function StatusBadge({ status }: { status: Invoice["status"] }) {
  const s = STATUS_MAP[status];
  return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${s.classes}`}>{s.label}</span>;
}

// ════════════════════════════════════════════════════════════════════════════
//  CategorySelect
// ════════════════════════════════════════════════════════════════════════════
interface CategorySelectProps {
  categories: InvoiceCategory[];
  value: string;
  onChange: (val: string) => void;
  onCategoryAdded: (cat: InvoiceCategory) => void;
  onCategoryDeleted: (id: number) => void;
}

function CategorySelect({ categories, value, onChange, onCategoryAdded, onCategoryDeleted }: CategorySelectProps) {
  const [adding, setAdding]         = useState(false);
  const [managing, setManaging]     = useState(false);
  const [newName, setNewName]       = useState("");
  const [saving, setSaving]         = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError]           = useState("");

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true); setError("");
    try {
      const res = await invoicesApi.createCategory(newName.trim());
      onCategoryAdded(res.data);
      onChange(String(res.data.id));
      setNewName(""); setAdding(false);
    } catch { setError("حدث خطأ، حاول مرة أخرى"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (cat: InvoiceCategory) => {
    if (!confirm(`هل أنت متأكد من حذف فئة "${cat.name}"؟`)) return;
    setDeletingId(cat.id); setError("");
    try {
      await invoicesApi.deleteCategory(cat.id);
      onCategoryDeleted(cat.id);
      if (value === String(cat.id)) onChange("");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? "لا يمكن حذف الفئة");
    } finally { setDeletingId(null); }
  };

  return (
    <div>
      <label className="label">الفئة</label>
      <div className="flex gap-2">
        <select value={value} onChange={(e) => onChange(e.target.value)} className="input-field flex-1">
          <option value="">بدون فئة</option>
          {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>
        <button type="button"
          onClick={() => { setAdding(!adding); setManaging(false); setError(""); setNewName(""); }}
          className={`w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 transition-colors ${
            adding ? "bg-gold text-navy border-gold" : "border-border text-gray-text hover:border-gold hover:text-gold"
          }`}>
          {adding ? <X size={16} /> : <Plus size={16} />}
        </button>
        <button type="button"
          onClick={() => { setManaging(!managing); setAdding(false); setError(""); setNewName(""); }}
          className={`w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 transition-colors ${
            managing ? "bg-red-50 text-red-500 border-red-300" : "border-border text-gray-text hover:border-red-300 hover:text-red-400"
          }`}>
          <Trash2 size={15} />
        </button>
      </div>
      {adding && (
        <div className="mt-2 flex gap-2">
          <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
            placeholder="اسم الفئة الجديدة" className="input-field flex-1" autoFocus />
          <button type="button" onClick={handleAdd} disabled={saving || !newName.trim()}
            className="w-10 h-10 rounded-lg bg-gold text-navy flex items-center justify-center flex-shrink-0 disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={16} />}
          </button>
        </div>
      )}
      {managing && (
        <div className="mt-2 border border-red-200 rounded-xl overflow-hidden">
          {categories.length === 0
            ? <p className="text-center text-sm text-gray-text py-3">لا توجد فئات</p>
            : categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between px-3 py-2.5 border-b border-border last:border-0 hover:bg-red-50/50 transition-colors">
                <span className="text-sm text-dark">{cat.name}</span>
                <button type="button" onClick={() => handleDelete(cat)} disabled={deletingId === cat.id}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-text hover:text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50">
                  {deletingId === cat.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                </button>
              </div>
            ))}
        </div>
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  InvoiceModal
// ════════════════════════════════════════════════════════════════════════════
interface InvoiceModalProps {
  isOpen: boolean; onClose: () => void; onSave: () => void;
  categories: InvoiceCategory[];
  setCategories: React.Dispatch<React.SetStateAction<InvoiceCategory[]>>;
  editingInvoice: Invoice | null;
}

function InvoiceModal({ isOpen, onClose, onSave, categories, setCategories, editingInvoice }: InvoiceModalProps) {
  const [categoryId, setCategoryId]   = useState("");
  const [supplier, setSupplier]       = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [status, setStatus]           = useState<Invoice["status"]>("unpaid");
  const [notes, setNotes]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");

  useEffect(() => {
    if (editingInvoice) {
      setCategoryId(editingInvoice.category_id ? String(editingInvoice.category_id) : "");
      setSupplier(editingInvoice.supplier);
      setInvoiceDate(editingInvoice.invoice_date.slice(0, 10));
      setTotalAmount(editingInvoice.total_amount);
      setStatus(editingInvoice.status);
      setNotes(editingInvoice.notes ?? "");
    } else {
      setCategoryId(""); setSupplier("");
      setInvoiceDate(new Date().toISOString().slice(0, 10));
      setTotalAmount(""); setStatus("unpaid"); setNotes("");
    }
    setError("");
  }, [editingInvoice, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const data = { category_id: categoryId || null, supplier, invoice_date: invoiceDate, total_amount: totalAmount, status, notes };
      if (editingInvoice) { await invoicesApi.update(editingInvoice.id, data); }
      else { await invoicesApi.create(data); }
      onSave(); onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errors = axiosErr?.response?.data?.errors;
      setError(errors ? (Object.values(errors)[0]?.[0] ?? "حدث خطأ") : (axiosErr?.response?.data?.message ?? "حدث خطأ"));
    } finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-white z-10">
          <h3 className="text-lg font-bold text-dark">{editingInvoice ? "تعديل الفاتورة" : "إضافة فاتورة جديدة"}</h3>
          <button onClick={onClose} className="text-gray-text hover:text-dark transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>}
          <CategorySelect
            categories={categories} value={categoryId} onChange={setCategoryId}
            onCategoryAdded={(cat) => setCategories((prev) => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name, "ar")))}
            onCategoryDeleted={(id) => setCategories((prev) => prev.filter((c) => c.id !== id))}
          />
          <div>
            <label className="label">المورد <span className="text-red-500">*</span></label>
            <input type="text" value={supplier} onChange={(e) => setSupplier(e.target.value)}
              placeholder="اسم المورد أو الشركة" className="input-field" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">تاريخ الفاتورة <span className="text-red-500">*</span></label>
              <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label className="label">المبلغ الكلي <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-text text-sm">د.م</span>
                <input type="number" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="0.00" className="input-field pl-10" min="0" step="0.01" required />
              </div>
            </div>
          </div>
          <div>
            <label className="label">الحالة</label>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStatus("unpaid")}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                  status === "unpaid" ? "bg-red-50 border-red-300 text-red-700" : "border-border text-gray-text hover:border-gray-300"
                }`}>غير مدفوعة</button>
              <button type="button" onClick={() => setStatus("paid")}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                  status === "paid" ? "bg-green-50 border-green-300 text-green-700" : "border-border text-gray-text hover:border-gray-300"
                }`}>مدفوعة</button>
            </div>
          </div>
          <div>
            <label className="label">ملاحظات</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="أي ملاحظات إضافية (اختياري)" className="input-field h-20 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-2.5 disabled:opacity-60">
              {loading ? <><Loader2 size={16} className="animate-spin" /><span>جارِ الحفظ...</span></> : <span>{editingInvoice ? "حفظ التعديلات" : "حفظ الفاتورة"}</span>}
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
const STATUS_FILTERS = [
  { value: "", label: "الكل" },
  { value: "unpaid", label: "غير مدفوعة" },
  { value: "paid",   label: "مدفوعة" },
];

interface Totals { all: number; paid: number; unpaid: number; }

export default function InvoicesPage() {
  const [invoices, setInvoices]         = useState<PaginatedResponse<Invoice> | null>(null);
  const [totals, setTotals]             = useState<Totals>({ all: 0, paid: 0, unpaid: 0 });
  const [categories, setCategories]     = useState<InvoiceCategory[]>([]);
  const [loading, setLoading]           = useState(true);
  const [searchInput, setSearchInput]   = useState("");
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [monthFilter, setMonthFilter]   = useState("");
  const [page, setPage]                 = useState(1);
  const [modalOpen, setModalOpen]       = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [deletingId, setDeletingId]     = useState<number | null>(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await invoicesApi.list({
        search: search || undefined,
        status: statusFilter || undefined,
        category_id: categoryFilter ? Number(categoryFilter) : undefined,
        month: monthFilter || undefined,
        page, per_page: 10,
      });
      const data = res.data as PaginatedResponse<Invoice> & { totals: Totals };
      setInvoices(data);
      if (data.totals) setTotals(data.totals);
    } finally { setLoading(false); }
  }, [search, statusFilter, categoryFilter, monthFilter, page]);

  useEffect(() => { invoicesApi.categories().then((r) => setCategories(r.data)); }, []);
  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذه الفاتورة؟")) return;
    setDeletingId(id);
    try { await invoicesApi.delete(id); fetchInvoices(); }
    finally { setDeletingId(null); }
  };

  const fmt = (n: number) => n.toLocaleString("ar-MA") + " د.م";

  return (
    <div>
      <Topbar title="الفواتير" breadcrumb={[{ label: "الرئيسية" }, { label: "الفواتير" }]} />
      <div className="p-3 sm:p-6">

        {/* بطاقات المجاميع */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="card border-r-4 border-navy">
            <p className="text-xs text-gray-text mb-1">الإجمالي الكلي</p>
            <p className="text-xl font-bold text-dark">{fmt(totals.all)}</p>
          </div>
          <div className="card border-r-4 border-red-400">
            <p className="text-xs text-gray-text mb-1">غير مدفوعة</p>
            <p className="text-xl font-bold text-red-600">{fmt(totals.unpaid)}</p>
          </div>
          <div className="card border-r-4 border-green-400">
            <p className="text-xs text-gray-text mb-1">مدفوعة</p>
            <p className="text-xl font-bold text-green-600">{fmt(totals.paid)}</p>
          </div>
        </div>

        {/* شريط الأدوات */}
        <div className="mb-6">
          <button onClick={() => { setEditingInvoice(null); setModalOpen(true); }} className="btn-primary">
            <Plus size={16} /><span>فاتورة جديدة</span>
          </button>
        </div>

        {/* الفلاتر */}
        <div className="card mb-4">
          <div className="flex flex-wrap gap-3">
            {/* بحث */}
            <div className="relative flex-1 min-w-[160px]">
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-text" />
              <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                placeholder="ابحث بالمورد..." className="input-field pr-8" />
            </div>

            {/* فلتر الشهر */}
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => { setMonthFilter(e.target.value); setPage(1); }}
              className="input-field w-44"
            />

            {/* فلتر الفئة */}
            <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="input-field w-40">
              <option value="">جميع الفئات</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            {/* فلتر الحالة */}
            <div className="flex gap-2">
              {STATUS_FILTERS.map((f) => (
                <button key={f.value} onClick={() => { setStatusFilter(f.value); setPage(1); }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    statusFilter === f.value ? "bg-navy text-white border-navy" : "border-border text-gray-text hover:border-navy hover:text-navy"
                  }`}>{f.label}</button>
              ))}
            </div>

            {/* زر إعادة تعيين */}
            {(monthFilter || categoryFilter || statusFilter || searchInput) && (
              <button onClick={() => { setMonthFilter(""); setCategoryFilter(""); setStatusFilter(""); setSearchInput(""); setPage(1); }}
                className="text-sm text-gray-text hover:text-dark transition-colors px-2">
                مسح الفلاتر
              </button>
            )}
          </div>
        </div>

        {/* الجدول */}
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead className="bg-cream border-b border-border">
              <tr>
                <th className="text-right text-sm font-semibold text-dark px-4 py-3">الفئة</th>
                <th className="text-right text-sm font-semibold text-dark px-4 py-3">المورد</th>
                <th className="text-right text-sm font-semibold text-dark px-4 py-3">التاريخ</th>
                <th className="text-right text-sm font-semibold text-dark px-4 py-3">المبلغ</th>
                <th className="text-right text-sm font-semibold text-dark px-4 py-3">الحالة</th>
                <th className="text-right text-sm font-semibold text-dark px-4 py-3">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-20"><Loader2 size={32} className="animate-spin text-gold mx-auto" /></td></tr>
              ) : invoices?.data.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-20">
                  <FileText size={40} className="text-border mx-auto mb-3" />
                  <p className="text-gray-text">لا توجد فواتير</p>
                </td></tr>
              ) : (
                invoices?.data.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-border last:border-0 hover:bg-cream/50 transition-colors">
                    <td className="px-4 py-3">
                      {invoice.category
                        ? <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-gold/10 text-dark">{invoice.category.name}</span>
                        : <span className="text-gray-text text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 font-medium text-dark text-sm">{invoice.supplier}</td>
                    <td className="px-4 py-3 text-sm text-gray-text">
                      {new Date(invoice.invoice_date).toLocaleDateString("ar-MA")}
                    </td>
                    <td className="px-4 py-3 font-bold text-dark text-sm whitespace-nowrap">
                      {Number(invoice.total_amount).toLocaleString("ar-MA")} د.م
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={invoice.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditingInvoice(invoice); setModalOpen(true); }}
                          className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-gray-text hover:border-gold hover:text-gold transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(invoice.id)} disabled={deletingId === invoice.id}
                          className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-gray-text hover:border-red-400 hover:text-red-500 transition-colors disabled:opacity-50">
                          {deletingId === invoice.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
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
        {invoices && invoices.last_page > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-text">
              من {(invoices.current_page - 1) * invoices.per_page + 1} إلى{" "}
              {Math.min(invoices.current_page * invoices.per_page, invoices.total)} من {invoices.total} فاتورة
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={invoices.current_page === 1}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-gray-text hover:border-gold hover:text-gold transition-colors disabled:opacity-40">
                <ChevronRight size={16} />
              </button>
              {Array.from({ length: invoices.last_page }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - invoices.current_page) <= 2)
                .map((p) => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      p === invoices.current_page ? "bg-gold text-navy" : "border border-border text-gray-text hover:border-gold hover:text-gold"
                    }`}>{p}</button>
                ))}
              <button onClick={() => setPage((p) => Math.min(invoices.last_page, p + 1))} disabled={invoices.current_page === invoices.last_page}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-gray-text hover:border-gold hover:text-gold transition-colors disabled:opacity-40">
                <ChevronLeft size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <InvoiceModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingInvoice(null); }}
        onSave={fetchInvoices}
        categories={categories}
        setCategories={setCategories}
        editingInvoice={editingInvoice}
      />
    </div>
  );
}