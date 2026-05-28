"use client";

import { useState } from "react";
import { X, Eye, EyeOff, Loader2 } from "lucide-react";
import type { NewBusinessForm, PlanType, BusinessStatus } from "./types";
import { EMPTY_FORM } from "./types";

interface Props {
  title?:   string;
  initial?: Partial<NewBusinessForm>;
  onSave:   (data: NewBusinessForm) => Promise<void>;
  onCancel: () => void;
}

export default function AddBusinessModal({ title = "إضافة محل جديد", initial, onSave, onCancel }: Props) {
  const [form, setForm]             = useState<NewBusinessForm>({ ...EMPTY_FORM, ...initial });
  const [showPassword, setShowPass] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  const set = (field: keyof NewBusinessForm, value: string) =>
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
        const first = Object.values(errors)[0]?.[0];
        setError(first ?? "حدث خطأ أثناء الحفظ");
      } else {
        setError(axiosErr?.response?.data?.message ?? "حدث خطأ أثناء الحفظ");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-cream-light border border-border rounded-lg px-3 py-2 text-sm text-dark placeholder:text-gray-text focus:outline-none focus:border-gold transition-colors";
  const labelCls = "block text-xs font-medium text-gray-text mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-2xl shadow-2xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <h2 className="font-bold text-dark text-lg">{title}</h2>
          <button onClick={onCancel} className="text-gray-text hover:text-dark transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

            {/* رسالة الخطأ */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            {/* ── قسم 1: معلومات المحل ── */}
            <section>
              <h3 className="text-sm font-bold text-dark mb-3 pb-2 border-b border-border">
                معلومات المحل
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelCls}>اسم المحل *</label>
                  <input required value={form.name} onChange={(e) => set("name", e.target.value)}
                    placeholder="مثال: قاعة الورود" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>الهاتف</label>
                  <input value={form.phone} onChange={(e) => set("phone", e.target.value)}
                    placeholder="0612345678" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>البريد الإلكتروني</label>
                  <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                    placeholder="hall@example.com" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>المدينة</label>
                  <input value={form.city} onChange={(e) => set("city", e.target.value)}
                    placeholder="مثال: وجدة" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>العنوان</label>
                  <input value={form.address} onChange={(e) => set("address", e.target.value)}
                    placeholder="الشارع، الحي..." className={inputCls} />
                </div>
              </div>
            </section>

            {/* ── قسم 2: معلومات صاحب المحل ── */}
            <section>
              <h3 className="text-sm font-bold text-dark mb-3 pb-2 border-b border-border">
                معلومات صاحب المحل
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelCls}>الاسم الكامل *</label>
                  <input required value={form.ownerName} onChange={(e) => set("ownerName", e.target.value)}
                    placeholder="محمد الإدريسي" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>البريد الإلكتروني *</label>
                  <input required type="email" value={form.ownerEmail} onChange={(e) => set("ownerEmail", e.target.value)}
                    placeholder="owner@example.com" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>رقم الهاتف</label>
                  <input value={form.ownerPhone} onChange={(e) => set("ownerPhone", e.target.value)}
                    placeholder="0612345678" className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>كلمة المرور * (8 أحرف على الأقل)</label>
                  <div className="relative">
                    <input required type={showPassword ? "text" : "password"} value={form.ownerPassword}
                      onChange={(e) => set("ownerPassword", e.target.value)}
                      placeholder="••••••••" className={`${inputCls} pl-9`} />
                    <button type="button" onClick={() => setShowPass(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-text hover:text-gold transition-colors">
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* ── قسم 3: معلومات الاشتراك ── */}
            <section>
              <h3 className="text-sm font-bold text-dark mb-3 pb-2 border-b border-border">
                معلومات الاشتراك
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>نوع الباقة</label>
                  <select value={form.plan} onChange={(e) => set("plan", e.target.value as PlanType)} className={inputCls}>
                    <option value="Basic">Basic</option>
                    <option value="Premium">Premium</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>الحالة</label>
                  <select value={form.status} onChange={(e) => set("status", e.target.value as BusinessStatus)} className={inputCls}>
                    <option value="active">نشط</option>
                    <option value="disabled">معطل</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>تاريخ بداية الاشتراك</label>
                  <input type="date" value={form.planStart} onChange={(e) => set("planStart", e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>تاريخ نهاية الاشتراك</label>
                  <input type="date" value={form.planExpiry} onChange={(e) => set("planExpiry", e.target.value)} className={inputCls} />
                </div>
              </div>
            </section>

          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t border-border flex-shrink-0">
            <button type="button" onClick={onCancel} disabled={loading}
              className="flex-1 py-2.5 border border-border rounded-xl text-sm text-dark hover:bg-cream-light transition-colors disabled:opacity-50">
              إلغاء
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-gold text-navy rounded-xl text-sm font-semibold hover:bg-gold/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? "جارِ الحفظ..." : "حفظ المحل"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}