"use client";

import { X, Trash2 } from "lucide-react";
import type { Owner } from "./types";

interface Props {
  owner:     Owner;
  onConfirm: () => void;
  onCancel:  () => void;
}

export default function DeleteConfirmModal({ owner, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[92vh] overflow-y-auto">

        <button onClick={onCancel} className="absolute left-4 top-4 text-gray-text hover:text-dark transition-colors">
          <X size={18} />
        </button>

        <div className="flex items-center justify-center w-14 h-14 bg-red-100 rounded-2xl mx-auto mb-4">
          <Trash2 size={24} className="text-red-500" />
        </div>

        <h3 className="text-lg font-bold text-dark text-center mb-2">تأكيد حذف الحساب</h3>
        <p className="text-gray-text text-sm text-center mb-1">هل أنت متأكد من حذف حساب</p>
        <p className="text-dark font-bold text-center text-base mb-4">"{owner.name}"؟</p>

        <div className="bg-red-50 rounded-xl px-4 py-2.5 mb-6">
          <p className="text-xs text-red-500 text-center">
            سيتم حذف الحساب والمحل المرتبط به بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
          </p>
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 border border-border rounded-xl text-sm text-dark hover:bg-cream-light transition-colors">
            إلغاء
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors">
            نعم، احذف الحساب
          </button>
        </div>

      </div>
    </div>
  );
}