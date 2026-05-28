"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import type { Owner, EditOwnerForm } from "./types";

interface Props {
  owner:     Owner;
  onSave:    (data: EditOwnerForm) => Promise<void>;
  onCancel:  () => void;
}

export default function EditOwnerModal({ owner, onSave, onCancel }: Props) {
  const [form, setForm]     = useState<EditOwnerForm>({
    name:  owner.name,
    email: owner.email,
    phone: owner.phone,
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const set = (field: keyof EditOwnerForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await onSave(form);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errors = axiosErr?.response?.data?.errors;
      if (errors) {
        setError(Object.values(errors)[0]?.[0] ?? "حدث خطأ");
      } else {
        setError(axiosErr?.response?.data?.message ?? "حدث خطأ أثناء الحفظ");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-cream-light border border-border rounded-lg px-3 py-2 text-sm text-dark placeholder:text-gray-text focus:outline-none focus:border-gold";
  const labelCls = "block text-xs font-medium text-gray-text mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl max-h-[92vh] overflow-y-auto">

        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-bold text-dark text-lg">تعديل بيانات صاحب المحل</h2>
          <button onClick={onCancel} className="text-gray-text hover:text-dark transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label className={labelCls}>الاسم الكامل *</label>
            <input required value={form.name} onChange={(e) => set("name", e.target.value)}
              placeholder="الاسم الكامل" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>البريد الإلكتروني *</label>
            <input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
              placeholder="email@example.com" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>رقم الهاتف</label>
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)}
              placeholder="0612345678" className={inputCls} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancel} disabled={loading}
              className="flex-1 py-2.5 border border-border rounded-xl text-sm text-dark hover:bg-cream-light transition-colors disabled:opacity-50">
              إلغاء
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-gold text-navy rounded-xl text-sm font-semibold hover:bg-gold/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? "جارِ الحفظ..." : "حفظ التعديلات"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}