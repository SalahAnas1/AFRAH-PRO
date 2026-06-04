"use client";
import { useLanguage } from "@/context/LanguageContext";
import { useEffect, useState, useCallback } from "react";
import { dashboardApi } from "@/lib/api";
import NotificationBell from "@/components/NotificationBell";
import DarkModeToggle from "@/components/DarkModeToggle";
import LargeAdBanner from "@/components/layout/LargeAdBanner";
import Link from "next/link";
import {
  Eye, EyeOff, ChevronLeft, ChevronRight,
  AlertCircle, Package, Users, TrendingUp, CalendarDays, TriangleAlert,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DashBooking {
  id: number; client_name: string; client_phone: string; status: string;
  notes: string | null; product_count: number; service_count: number;
  worker_count: number; revenue: number;
}
interface DashWorker   { id: number; worker_name: string; cost: number; booking_id: number; client_name: string; }
interface DashInventory{ id: number; name: string; stock: number; reserved: number; available: number; }
interface DashAlert    { type: string; severity: string; message: string; }
interface DashData {
  date: string; bookings_count: number; workers_count: number;
  revenue: number; expenses: number; net_profit: number;
  upcoming_count: number; low_stock_count: number;
  bookings: DashBooking[]; workers: DashWorker[];
  inventory: DashInventory[]; alerts: DashAlert[];
}

// STATUS_LABELS via t() in component
const STATUS_COLORS: Record<string,string> = {
  draft:"bg-gray-100 text-gray-600", confirmed:"bg-blue-100 text-blue-700",
  completed:"bg-green-100 text-green-700", cancelled:"bg-red-100 text-red-700",
};
// calendar data via useLanguage context

// ─── Calendar Grid ────────────────────────────────────────────────────────────

function CalendarGrid({ year, month, calMap, selectedDate, today, onDayClick }: {
  year: number; month: number; calMap: Record<string, number>;
  selectedDate: string; today: string; onDayClick: (d: string) => void;
}) {
  const { calendar } = useLanguage();
  const firstDay      = new Date(year, month - 1, 1).getDay();
  const daysInMonth   = new Date(year, month, 0).getDate();
  const daysInPrevMon = new Date(year, month - 1, 0).getDate();

  type Cell = { day: number; inMonth: boolean; dateStr: string };
  const cells: Cell[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrevMon - i;
    const m = month === 1 ? 12 : month - 1;
    const y = month === 1 ? year - 1 : year;
    cells.push({ day: d, inMonth: false, dateStr: `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}` });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, inMonth: true, dateStr: `${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}` });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const m = month === 12 ? 1 : month + 1;
    const y = month === 12 ? year + 1 : year;
    cells.push({ day: d, inMonth: false, dateStr: `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}` });
  }

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {calendar.days.map((d, i) => (
          <div key={d} className={`text-center text-xs font-medium py-2 ${i === 0 ? "text-red-400" : "text-gray-400"}`}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          const isToday    = cell.dateStr === today;
          const isSelected = cell.dateStr === selectedDate;
          const count      = cell.inMonth ? (calMap[String(cell.day)] ?? 0) : 0;
          const isSunday   = i % 7 === 0;
          return (
            <button key={i} onClick={() => onDayClick(cell.dateStr)}
              className={`flex flex-col items-center py-2 rounded-xl transition-colors min-h-[52px] relative ${
                isSelected ? "bg-rose-500 text-white" :
                isToday    ? "bg-rose-50 ring-1 ring-rose-200" :
                cell.inMonth ? "hover:bg-gray-50" : ""
              }`}>
              <span className={`text-sm font-medium ${
                !cell.inMonth ? "text-gray-200" :
                isSelected    ? "text-white" :
                isSunday      ? "text-red-400" :
                "text-gray-700"
              }`}>{cell.day}</span>
              {cell.inMonth && count > 0 && (
                <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? "bg-white/70" : "bg-blue-400"}`}/>
              )}
              {cell.inMonth && count > 1 && (
                <span className={`text-[9px] leading-none ${isSelected ? "text-white/80" : "text-gray-400"}`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  const colors = ["from-rose-400 to-rose-600","from-blue-400 to-blue-600","from-emerald-400 to-emerald-600","from-violet-400 to-violet-600","from-amber-400 to-amber-600"];
  const idx = name.charCodeAt(0) % colors.length;
  const sClass = size === "md" ? "w-9 h-9 text-sm" : "w-7 h-7 text-xs";
  return (
    <div className={`${sClass} rounded-full bg-gradient-to-br ${colors[idx]} flex items-center justify-center text-white font-bold shrink-0`}>
      {name.charAt(0)}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { t, calendar } = useLanguage();
  const todayDate = new Date();
  const todayStr  = todayDate.toISOString().split("T")[0];

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [calYear,  setCalYear]   = useState(todayDate.getFullYear());
  const [calMonth, setCalMonth]  = useState(todayDate.getMonth() + 1);
  const [calMap,   setCalMap]    = useState<Record<string,number>>({});
  const [data,     setData]      = useState<DashData | null>(null);
  const [loading,  setLoading]   = useState(true);
  const [hideNums, setHideNums]  = useState(true);

  const fmt  = (n: number) => hideNums ? "••••••" : n.toLocaleString(calendar.locale) + " د.م";

  const loadCalendar = useCallback(async (y: number, m: number) => {
    try { const res = await dashboardApi.calendar(y, m); setCalMap(res.data); } catch {}
  }, []);

  const loadDay = useCallback(async (date: string) => {
    setLoading(true);
    try { const res = await dashboardApi.index(date); setData(res.data); }
    catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { loadDay(selectedDate); }, [selectedDate, loadDay]);
  useEffect(() => { loadCalendar(calYear, calMonth); }, [calYear, calMonth, loadCalendar]);

  const goToday = () => {
    setSelectedDate(todayStr);
    setCalYear(todayDate.getFullYear());
    setCalMonth(todayDate.getMonth() + 1);
  };

  const prevMonth = () => {
    if (calMonth === 1) { setCalYear(y => y - 1); setCalMonth(12); } else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 12) { setCalYear(y => y + 1); setCalMonth(1); } else setCalMonth(m => m + 1);
  };

  const selObj   = new Date(selectedDate + "T12:00:00");
  const selShort = selObj.toLocaleDateString(calendar.locale, { day: "numeric", month: "long" });
  const selFull  = selObj.toLocaleDateString(calendar.locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const invStatus = !data ? "—" : data.low_stock_count > 0 ? `تنبيه (${data.low_stock_count})` : "جيد";
  const invColor  = !data ? "text-gray-400" : data.low_stock_count > 0 ? "text-orange-500" : "text-emerald-600";
  const invBg     = !data ? "bg-gray-50" : data.low_stock_count > 0 ? "bg-orange-50" : "bg-emerald-50";
  const invIconC  = !data ? "text-gray-400" : data.low_stock_count > 0 ? "text-orange-500" : "text-emerald-500";

  return (
    <div className="min-h-screen bg-gray-50/60">

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">لوحة التحكم</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setHideNums(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            {hideNums ? <EyeOff size={14}/> : <Eye size={14}/>}
            {hideNums ? t("dashboard.showNumbers") : t("dashboard.hideNumbers")}
          </button>
          <DarkModeToggle compact={true} onDark={false} />
          <NotificationBell />
        </div>
      </div>

      <div className="p-3 sm:p-5 space-y-4 sm:space-y-5">

        {/* ── Banner إعلان كبير ── */}
        <LargeAdBanner />

        {/* ── 5 Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">

          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
              <AlertCircle size={18} className="text-purple-500"/>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-gray-400 font-medium">الحجوزات القادمة</p>
              <p className="text-xl font-bold text-purple-600 mt-0.5">{loading ? "—" : (data?.upcoming_count ?? 0)}</p>
              <p className="text-[10px] text-gray-400">خلال 7 أيام</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl ${invBg} flex items-center justify-center shrink-0`}>
              <Package size={18} className={invIconC}/>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-gray-400 font-medium">حالة المخزون</p>
              <p className={`text-xl font-bold mt-0.5 ${invColor}`}>{loading ? "—" : invStatus}</p>
              <p className="text-[10px] text-gray-400">{loading ? "" : data?.low_stock_count ? t("dashboard.lowStock") : t("dashboard.allAvailable")}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Users size={18} className="text-blue-500"/>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-gray-400 font-medium">العمال اليوم</p>
              <p className="text-xl font-bold text-blue-600 mt-0.5">{loading ? "—" : (data?.workers_count ?? 0)}</p>
              <p className="text-[10px] text-gray-400">عامل</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <TrendingUp size={18} className="text-amber-500"/>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-gray-400 font-medium">إجمالي الإيرادات اليوم</p>
              <p className="text-base font-bold text-amber-600 mt-0.5 leading-tight truncate">{loading ? "—" : fmt(data?.revenue ?? 0)}</p>
              <p className="text-[10px] text-gray-400">{selShort}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
              <CalendarDays size={18} className="text-rose-500"/>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-gray-400 font-medium">حجوزات اليوم</p>
              <p className="text-xl font-bold text-rose-600 mt-0.5">{loading ? "—" : (data?.bookings_count ?? 0)}</p>
              <p className="text-[10px] text-gray-400">حجز</p>
            </div>
          </div>

        </div>

        {/* ── Alerts ── */}
        {!loading && data && data.alerts.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {data.alerts.slice(0, 5).map((a, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-100 rounded-xl text-xs text-orange-700">
                <TriangleAlert size={12} className="text-orange-400 shrink-0"/>
                {a.message}
              </div>
            ))}
          </div>
        )}

        {/* ── Main 2-col ── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-4 items-start">

          {/* Calendar */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <button onClick={prevMonth} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <ChevronRight size={14}/>
                </button>
                <button onClick={nextMonth} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <ChevronLeft size={14}/>
                </button>
                <button onClick={goToday} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600">
                  اليوم
                </button>
              </div>
              <h2 className="text-lg font-bold text-gray-800">{calendar.months[calMonth - 1]} {calYear}</h2>
            </div>

            <CalendarGrid year={calYear} month={calMonth} calMap={calMap}
              selectedDate={selectedDate} today={todayStr} onDayClick={setSelectedDate}/>

            <div className="flex items-center gap-5 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block"/>يوجد حجوزات
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full ring-1 ring-rose-200 bg-rose-50 inline-block"/>اليوم الحالي
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-rose-500 inline-block"/>اليوم المحدد
              </span>
            </div>
          </div>

          {/* Day detail panel */}
          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">

            {/* Panel header */}
            <div className="px-5 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800">تفاصيل {selFull}</h3>
              {selectedDate !== todayStr && (
                <button onClick={goToday} className="text-xs text-rose-500 hover:underline">رجوع لليوم</button>
              )}
            </div>

            {/* Bookings section */}
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <CalendarDays size={13} className="text-rose-400"/>
                  الحجوزات في هذا اليوم
                  <span className="text-gray-400">({loading ? "..." : data?.bookings_count ?? 0})</span>
                </p>
                <Link href="/bookings" className="text-[11px] text-rose-500 hover:underline">عرض الكل</Link>
              </div>

              {loading ? (
                <div className="space-y-2">{[0,1,2].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
              ) : !data || data.bookings.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4 bg-gray-50 rounded-xl">لا توجد حجوزات في هذا اليوم</p>
              ) : (
                <div className="space-y-2">
                  {data.bookings.map(b => (
                    <Link key={b.id} href={`/bookings/${b.id}`}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${STATUS_COLORS[b.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {{ draft: t("bookings.statuses.draft"), confirmed: t("bookings.statuses.confirmed"), completed: t("bookings.statuses.completed"), cancelled: t("bookings.statuses.cancelled") }[b.status] ?? b.status}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{b.client_name}</p>
                          <p className="text-[10px] text-gray-400">
                            {b.product_count} منتج · {b.service_count} خدمة · {b.worker_count} عامل
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-rose-600 shrink-0 mr-2">{fmt(b.revenue)}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Inventory section */}
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <Package size={13} className="text-blue-400"/>المخزون في هذا اليوم
                </p>
                <Link href="/inventory" className="text-[11px] text-rose-500 hover:underline">تفاصيل</Link>
              </div>

              {loading ? (
                <div className="space-y-2">{[0,1,2].map(i => <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse"/>)}</div>
              ) : !data || data.inventory.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-3 bg-gray-50 rounded-xl">لا يوجد مخزون محجوز اليوم</p>
              ) : (
                <div className="space-y-2.5">
                  {data.inventory.slice(0, 5).map(inv => {
                    const pct    = inv.stock > 0 ? Math.min((inv.reserved / inv.stock) * 100, 100) : 0;
                    const isLow  = inv.available <= 0 || (inv.stock > 0 && (inv.available / inv.stock) < 0.15);
                    return (
                      <div key={inv.id}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className={`font-medium ${isLow ? "text-red-600" : "text-gray-700"}`}>
                            {inv.name}
                            {isLow && <span className="text-red-400 mr-1 text-[10px]">⚠ منخفض</span>}
                          </span>
                          <span className="text-gray-400 tabular-nums">{inv.reserved} / {inv.stock}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${isLow ? "bg-red-400" : "bg-emerald-400"}`} style={{ width: `${pct}%` }}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Workers section */}
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <Users size={13} className="text-emerald-400"/>العمال في هذا اليوم
                  <span className="text-gray-400">({loading ? "..." : data?.workers_count ?? 0})</span>
                </p>
                <Link href="/workers" className="text-[11px] text-rose-500 hover:underline">عرض الكل</Link>
              </div>

              {loading ? (
                <div className="space-y-2">{[0,1,2].map(i => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
              ) : !data || data.workers.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-3 bg-gray-50 rounded-xl">لا يوجد عمال في هذا اليوم</p>
              ) : (
                <div className="space-y-1.5">
                  {data.workers.slice(0, 6).map(w => (
                    <div key={w.id} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                      <Avatar name={w.worker_name}/>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-800">{w.worker_name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{w.client_name}</p>
                      </div>
                      <span className="text-xs font-semibold text-blue-600 shrink-0">{fmt(w.cost)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ── Bottom Financial Summary ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <TrendingUp size={20} className="text-amber-500"/>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400">إجمالي الإيرادات · {selShort}</p>
              <p className="text-lg font-bold text-amber-600 truncate">{loading ? "..." : fmt(data?.revenue ?? 0)}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-orange-500">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400">إجمالي المصاريف · {selShort}</p>
              <p className="text-lg font-bold text-orange-500 truncate">{loading ? "..." : fmt(data?.expenses ?? 0)}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${data && data.net_profit < 0 ? "bg-red-50" : "bg-green-50"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className={`w-5 h-5 ${data && data.net_profit < 0 ? "text-red-500" : "text-green-500"}`}>
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400">صافي الربح · {selShort}</p>
              <p className={`text-lg font-bold truncate ${data && data.net_profit < 0 ? "text-red-600" : "text-green-600"}`}>
                {loading ? "..." : fmt(data?.net_profit ?? 0)}
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}