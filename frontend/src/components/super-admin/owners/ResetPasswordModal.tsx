"use client";

import { useState } from "react";
import { X, Eye, EyeOff, Loader2, KeyRound } from "lucide-react";
import type { Owner } from "./types";

interface Props {
  owner:     Owner;
  onSave:    (password: string) => Promise<void>;
  onCancel:  () => void;
}

export default function ResetPasswordModal({ owner, onSave, onCancel }: Props) {
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }
    if (password !== confirm) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSave(password);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message ?? "حدث خطأ أثناء تعيين كلمة المرور");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-cream-light border border-border rounded-lg px-3 py-2 text-sm text-dark placeholder:text-gray-text focus:outline-none focus:border-gold";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl max-h-[92vh] overflow-y-auto">

        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-bold text-dark text-lg">إعادة تعيين كلمة المرور</h2>
          <button onClick={onCancel} className="text-gray-text hover:text-dark transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* معلومات الحساب */}
          <div className="bg-cream-light rounded-xl px-4 py-3 flex items-center gap-3">
            <KeyRound size={16} className="text-gold flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-text">تعيين كلمة مرور جديدة لـ</p>
              <p className="text-sm font-semibold text-dark">{owner.name}</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* كلمة المرور الجديدة */}
          <div>
            <label className="block text-xs font-medium text-gray-text mb-1">
              كلمة المرور الجديدة *
            </label>
            <div className="relative">
              <input
                required
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8 أحرف على الأقل"
                className={`${inputCls} pl-9`}
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-text hover:text-gold transition-colors">
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* تأكيد كلمة المرور */}
          <div>
            <label className="block text-xs font-medium text-gray-text mb-1">
              تأكيد كلمة المرور *
            </label>
            <input
              required
              type={showPass ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="أعد كتابة كلمة المرور"
              className={inputCls}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onCancel} disabled={loading}
              className="flex-1 py-2.5 border border-border rounded-xl text-sm text-dark hover:bg-cream-light transition-colors disabled:opacity-50">
              إلغاء
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-gold text-navy rounded-xl text-sm font-semibold hover:bg-gold/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? "جارِ الحفظ..." : "تعيين كلمة المرور"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}