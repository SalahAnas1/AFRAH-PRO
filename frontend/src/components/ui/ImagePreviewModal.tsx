"use client";
import { useEffect } from "react";
import { X } from "lucide-react";

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: string;
  name: string;
  price?: string | number;
  description?: string;
}

export function ImagePreviewModal({
  isOpen, onClose, image, name, price, description,
}: ImagePreviewModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl overflow-hidden shadow-2xl w-full max-w-lg md:max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* زر الإغلاق */}
        <button
          onClick={onClose}
          className="absolute top-3 left-3 z-10 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
        >
          <X size={18} />
        </button>

        {/* الصورة الكبيرة */}
        <div className="bg-gray-50 flex items-center justify-center overflow-hidden flex-1 min-h-[40vh]">
          <img
            src={image}
            alt={name}
            className="max-w-full object-contain"
            style={{ maxHeight: "60vh" }}
          />
        </div>

        {/* المعلومات */}
        <div className="p-5 border-t border-border shrink-0 space-y-1">
          <h2 className="text-xl font-bold text-dark">{name}</h2>
          {price !== undefined && (
            <p className="text-gold font-bold text-lg">
              {Number(price).toLocaleString("ar-MA")}{" "}
              <span className="text-sm font-normal text-gray-text">د.م</span>
            </p>
          )}
          {description && (
            <p className="text-gray-text text-sm mt-2 leading-relaxed">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}