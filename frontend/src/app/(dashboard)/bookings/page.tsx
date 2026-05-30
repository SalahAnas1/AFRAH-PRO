"use client";
import { useLanguage } from "@/context/LanguageContext";
import { useEffect, useState, useCallback } from "react";
import { bookingsApi } from "@/lib/api";
import { Booking, BookingStatus } from "@/types";
import Link from "next/link";
import {
  Plus, Search, Calendar, Phone, ChevronLeft, ChevronRight,
  CheckCircle, Clock, XCircle, FileText, Pencil,
} from "lucide-react";

const STATUS_LABELS: Record<BookingStatus, string> = {
  draft: "مسودة",
  confirmed: "مؤكد",
  completed: "مكتمل",
  cancelled: "ملغي",
};

const STATUS_COLORS: Record<BookingStatus, string> = {
  draft:     "bg-gray-100 text-gray-700",
  confirmed: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const STATUS_ICON: Record<BookingStatus, React.ReactNode> = {
  draft:     <FileText size={14} />,
  confirmed: <Clock size={14} />,
  completed: <CheckCircle size={14} />,
  cancelled: <XCircle size={14} />,
};

export default function BookingsPage() {
  const [bookings, setBookings]   = useState<Booking[]>([]);
  const [totals, setTotals]       = useState({ all: 0, draft: 0, confirmed: 0, completed: 0, cancelled: 0 });
  const [search, setSearch]       = useState("");
  const [status, setStatus]       = useState("");
  const [month, setMonth]         = useState("");
  const [page, setPage]           = useState(1);
  const [lastPage, setLastPage]   = useState(1);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bookingsApi.list({
        search: search || undefined,
        status: status || undefined,
        month:  month  || undefined,
        page,
        per_page: 10,
      });
      const data = res.data;
      setBookings(data.data);
      setLastPage(data.last_page);
      setTotal(data.total);
      setTotals(data.totals);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [search, status, month, page]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);
  useEffect(() => { setPage(1); }, [search, status, month]);

  const firstDay = (booking: Booking) =>
    (booking.days ?? []).length > 0
      ? new Date(booking.days[0].date).toLocaleDateString("ar-DZ", { year: "numeric", month: "short", day: "numeric" })
      : "—";

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">الحجوزات</h1>
        <Link
          href="/bookings/new"
          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
        >
          <Plus size={18} />
          <span>حجز جديد</span>
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {([["all", "الكل"], ["draft", "مسودة"], ["confirmed", "مؤكد"], ["completed", "مكتمل"], ["cancelled", "ملغي"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setStatus(key === "all" ? "" : key)}
            className={`rounded-xl p-4 text-center border-2 transition-colors ${
              (key === "all" && !status) || status === key
                ? "border-rose-500 bg-rose-50"
                : "border-gray-200 bg-white hover:border-rose-300"
            }`}
          >
            <div className="text-2xl font-bold text-gray-800">{totals[key]}</div>
            <div className="text-sm text-gray-500 mt-1">{label}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="ابحث باسم العميل أو الهاتف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-9 pl-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-rose-400"
          />
        </div>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-400"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">جاري التحميل...</div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Calendar size={48} className="mx-auto mb-3 opacity-30" />
          <p>لا توجد حجوزات</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const totalRevenue = parseFloat(b.total_revenue ?? "0");
            const depositAmt   = parseFloat(b.deposit ?? "0");
            const remaining    = totalRevenue - depositAmt;

            return (
              <div key={b.id} className="bg-white rounded-xl border border-gray-200 hover:border-rose-300 hover:shadow-sm transition-all overflow-hidden flex items-stretch">

                {/* Main clickable area */}
                <Link href={`/bookings/${b.id}`} className="flex-1 block px-4 py-3 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-semibold text-gray-800">{b.client_name}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[b.status]}`}>
                          {STATUS_ICON[b.status]}
                          {STATUS_LABELS[b.status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1"><Phone size={12} />{b.client_phone}</span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />{firstDay(b)}
                          {(b.days ?? []).length > 1 && ` (+${b.days.length - 1} أيام)`}
                        </span>
                      </div>
                    </div>

                    {/* Financial info — static */}
                    <div className="text-left shrink-0 space-y-0.5">
                      <div>
                        <span className="text-[10px] text-gray-400 block">الإجمالي</span>
                        <span className="text-lg font-bold text-rose-600">{totalRevenue.toLocaleString("ar-DZ")} د.م</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block">المتبقي</span>
                        <span className={`text-sm font-semibold ${remaining > 0 ? "text-orange-500" : remaining < 0 ? "text-red-500" : "text-green-600"}`}>
                          {remaining.toLocaleString("ar-DZ")} د.م
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Edit button — separate column */}
                <Link
                  href={`/bookings/new?edit=${b.id}`}
                  className="flex items-center justify-center w-11 border-r border-gray-100 text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-colors shrink-0"
                  title="تعديل الحجز"
                >
                  <Pencil size={15} />
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">إجمالي: {total}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-200 hover:border-rose-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">{page} / {lastPage}</span>
            <button
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              disabled={page === lastPage}
              className="p-2 rounded-lg border border-gray-200 hover:border-rose-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
