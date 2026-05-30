"use client";
import { useLanguage } from "@/context/LanguageContext";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { bookingsApi } from "@/lib/api";
import { Booking, BookingStatus } from "@/types";
import Link from "next/link";
import {
  ArrowRight, Phone, MapPin, Calendar, CheckCircle, XCircle,
  Clock, FileText, Trash2, Package, Users, ReceiptText, Edit2,
} from "lucide-react";

const STATUS_LABELS: Record<BookingStatus, string> = {
  draft: "مسودة", confirmed: "مؤكد", completed: "مكتمل", cancelled: "ملغي",
};
const STATUS_COLORS: Record<BookingStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  confirmed: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("ar-DZ", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

export default function BookingDetailPage() {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchBooking = async () => {
    try {
      const res = await bookingsApi.get(parseInt(id));
      setBooking(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBooking(); }, [id]);

  const doAction = async (action: "confirm" | "complete" | "cancel") => {
    if (!booking) return;
    const confirmMsg = action === "cancel" ? t("bookings.detail.cancelConfirm") : null;
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setActionLoading(true);
    try {
      if (action === "confirm") await bookingsApi.confirm(booking.id);
      else if (action === "complete") await bookingsApi.complete(booking.id);
      else await bookingsApi.cancel(booking.id);
      await fetchBooking();
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!booking) return;
    if (!window.confirm(t("bookings.detail.deleteConfirm"))) return;
    await bookingsApi.delete(booking.id);
    router.push("/bookings");
  };

  if (loading) return <div className="p-3 sm:p-6 text-center text-gray-400">جاري التحميل...</div>;
  if (!booking) return <div className="p-3 sm:p-6 text-center text-gray-400">الحجز غير موجود</div>;

  const revenue  = booking.items.reduce((s, i) => s + i.quantity * parseFloat(i.unit_price), 0);
  const wCost    = booking.workers.reduce((s, w) => s + parseFloat(w.cost), 0);
  const eCost    = booking.expenses.reduce((s, e) => s + e.quantity * parseFloat(e.unit_price), 0);
  const costs    = wCost + eCost;
  const profit   = revenue - costs;

  return (
    <div className="p-3 sm:p-6 max-w-3xl mx-auto space-y-4 sm:space-y-6">
      {/* Back */}
      <Link href="/bookings" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowRight size={15} /> العودة للحجوزات
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-800">{booking.client_name}</h1>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 flex-wrap">
              <span className="flex items-center gap-1"><Phone size={13} />{booking.client_phone}</span>
              {booking.client_phone_alt && (
                <span className="flex items-center gap-1"><Phone size={13} />{booking.client_phone_alt}</span>
              )}
              {booking.address && (
                <span className="flex items-center gap-1"><MapPin size={13} />{booking.address}</span>
              )}
            </div>
          </div>
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[booking.status]}`}>
            {STATUS_LABELS[booking.status]}
          </span>
        </div>

        {/* Days */}
        <div className="flex flex-wrap gap-2">
          {booking.days.sort((a, b) => a.date.localeCompare(b.date)).map((d) => (
            <span key={d.id} className="flex items-center gap-1 bg-rose-50 text-rose-700 text-xs px-2 py-1 rounded-full">
              <Calendar size={12} /> {fmtDate(d.date)}
            </span>
          ))}
        </div>

        {booking.notes && (
          <p className="text-sm text-gray-500 border-t pt-2">{booking.notes}</p>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap border-t pt-3">
          {booking.status === "draft" && (
            <button
              onClick={() => doAction("confirm")}
              disabled={actionLoading}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-60 transition-colors"
            >
              <CheckCircle size={15} /> تأكيد الحجز
            </button>
          )}
          {booking.status === "confirmed" && (
            <button
              onClick={() => doAction("complete")}
              disabled={actionLoading}
              className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-60 transition-colors"
            >
              <CheckCircle size={15} /> إتمام الحجز
            </button>
          )}
          {(booking.status === "draft" || booking.status === "confirmed") && (
            <button
              onClick={() => doAction("cancel")}
              disabled={actionLoading}
              className="flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg text-sm disabled:opacity-60 transition-colors"
            >
              <XCircle size={15} /> إلغاء
            </button>
          )}
          <button
            onClick={handleDelete}
            className="flex items-center gap-1 text-red-400 hover:text-red-600 px-3 py-2 text-sm transition-colors mr-auto"
          >
            <Trash2 size={15} /> حذف
          </button>
        </div>
      </div>

      {/* Financial summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-xl font-bold text-green-600">{revenue.toLocaleString("ar-DZ")}</div>
          <div className="text-xs text-gray-500 mt-1">الإيرادات (د.م)</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-xl font-bold text-red-500">{costs.toLocaleString("ar-DZ")}</div>
          <div className="text-xs text-gray-500 mt-1">التكاليف (د.م)</div>
        </div>
        <div className={`rounded-xl border-2 p-4 text-center ${profit >= 0 ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}>
          <div className={`text-xl font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
            {profit.toLocaleString("ar-DZ")}
          </div>
          <div className="text-xs text-gray-500 mt-1">الربح الصافي (د.م)</div>
        </div>
      </div>

      {/* Items */}
      {booking.items.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Package size={16} className="text-rose-500" /> المنتجات والخدمات
          </h2>
          <div className="space-y-2">
            {booking.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${item.item_type === "service" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                    {item.item_type === "service" ? t("bookings.detail.service") : t("bookings.detail.product")}
                  </span>
                  <span className="text-sm text-gray-700">{item.item_name}</span>
                  <span className="text-xs text-gray-400">× {item.quantity}</span>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {(item.quantity * parseFloat(item.unit_price)).toLocaleString("ar-DZ")} د.م
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workers */}
      {booking.workers.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Users size={16} className="text-rose-500" /> العمال
          </h2>
          <div className="space-y-2">
            {booking.workers.map((w) => (
              <div key={w.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-700">{w.worker_name}</span>
                <span className="text-sm font-medium text-gray-700">{parseFloat(w.cost).toLocaleString("ar-DZ")} د.م</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expenses */}
      {booking.expenses.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <ReceiptText size={16} className="text-rose-500" /> المصاريف
          </h2>
          <div className="space-y-2">
            {booking.expenses.map((e) => (
              <div key={e.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <span className="text-sm text-gray-700">{e.name}</span>
                  <span className="text-xs text-gray-400 mr-2">× {e.quantity}</span>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {(e.quantity * parseFloat(e.unit_price)).toLocaleString("ar-DZ")} د.م
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}