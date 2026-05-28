"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { reportsApi } from "@/lib/api";
import {
  Eye, EyeOff, Printer, Download, TrendingUp, TrendingDown,
  ChevronLeft, ChevronRight, Users, Package, Sparkles, CalendarDays,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FinancialSummary {
  revenue: number; booking_expenses: number; worker_costs: number;
  invoices: number; total_expenses: number; net_profit: number; bookings_count: number;
}
interface MonthlyData  { month: number; bookings_count: number; revenue: number; expenses: number; net_profit: number; }
interface DailyData    { day: number; revenue: number; expenses: number; }
interface ReportBooking {
  id: number; client_name: string; client_phone: string; status: string; deposit: number;
  revenue: number; product_revenue: number; service_revenue: number;
  booking_expenses: number; worker_costs: number; net_profit: number; days: string[];
}
interface ReportItem  { item_id: number; item_name: string; bookings_count: number; uses?: number; total_qty: number; revenue: number; }
interface ReportWorker { worker_name: string; bookings_count: number; total_cost: number; }
interface ExpenseName { name: string; total: number; }
interface TopInvoice  { supplier: string; invoice_date: string; total_amount: number; }

const STATUS_LABELS: Record<string, string> = { draft:"مسودة", confirmed:"مؤكد", completed:"مكتمل", cancelled:"ملغي" };
const STATUS_COLORS: Record<string, string>  = { draft:"bg-gray-100 text-gray-600", confirmed:"bg-blue-100 text-blue-700", completed:"bg-green-100 text-green-700", cancelled:"bg-red-100 text-red-700" };
const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

// ─── SVG Donut Chart ──────────────────────────────────────────────────────────

function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const r = 52; const cx = 68; const cy = 68;
  const C = 2 * Math.PI * r;
  const total = segments.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div className="w-36 h-36 flex items-center justify-center text-xs text-gray-400">لا بيانات</div>;

  const withOffsets = segments.reduce<{ result: (typeof segments[0] & { len: number; off: number })[]; cum: number }>(
    (acc, seg) => {
      const len = (seg.value / total) * C;
      return { result: [...acc.result, { ...seg, len, off: -acc.cum }], cum: acc.cum + len };
    },
    { result: [], cum: 0 }
  ).result;

  return (
    <svg viewBox="0 0 136 136" className="w-36 h-36 shrink-0">
      {withOffsets.map((s, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none"
          stroke={s.color} strokeWidth="22"
          strokeDasharray={`${s.len} ${C - s.len}`}
          strokeDashoffset={s.off}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      ))}
      <text x={cx} y={cy - 5} textAnchor="middle" fill="#111827" fontSize="11" fontWeight="bold">
        {(total / 1000).toFixed(0)}k
      </text>
      <text x={cx} y={cy + 9} textAnchor="middle" fill="#9ca3af" fontSize="7">إجمالي المصاريف</text>
    </svg>
  );
}

// ─── SVG Line Chart ───────────────────────────────────────────────────────────

function LineChart({ data }: { data: DailyData[] }) {
  if (!data.length) return <div className="flex items-center justify-center h-full text-xs text-gray-400">لا بيانات</div>;
  const W = 480; const H = 120; const pL = 32; const pR = 8; const pT = 8; const pB = 22;
  const cW = W - pL - pR; const cH = H - pT - pB;
  const maxV = Math.max(...data.flatMap(d => [d.revenue, d.expenses]), 1);
  const x = (i: number) => pL + (i / Math.max(data.length - 1, 1)) * cW;
  const y = (v: number) => pT + (1 - v / maxV) * cH;

  const pts = (key: "revenue" | "expenses") => data.map((d, i) => `${x(i)},${y(d[key])}`).join(" ");
  const fill = (key: "revenue" | "expenses") =>
    `${pL},${pT + cH} ${pts(key)} ${x(data.length - 1)},${pT + cH}`;

  const yTicks = [0, maxV / 2, maxV];
  const xStep = Math.ceil(data.length / 6);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {yTicks.map((v, i) => (
        <g key={i}>
          <line x1={pL} y1={y(v)} x2={W - pR} y2={y(v)} stroke="#f3f4f6" strokeWidth="1" />
          <text x={pL - 3} y={y(v) + 3} textAnchor="end" fontSize="6" fill="#d1d5db">{Math.round(v / 1000)}k</text>
        </g>
      ))}
      <polygon points={fill("revenue")}  fill="rgba(16,185,129,0.08)" />
      <polyline points={pts("revenue")}  fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points={fill("expenses")} fill="rgba(239,68,68,0.06)" />
      <polyline points={pts("expenses")} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.filter((_, i) => i % xStep === 0 || i === data.length - 1).map(d => {
        const i = data.indexOf(d);
        return <text key={d.day} x={x(i)} y={H - 6} textAnchor="middle" fontSize="6" fill="#d1d5db">{d.day}</text>;
      })}
    </svg>
  );
}

// ─── Annual Bar Chart ─────────────────────────────────────────────────────────

function MonthlyBarChart({ data }: { data: MonthlyData[] }) {
  const max = Math.max(...data.flatMap(d => [d.revenue, d.expenses]), 1);
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">المقارنة الشهرية للإيرادات والمصاريف</h3>
      <div className="flex items-end gap-1">
        {data.map(d => {
          const revH = Math.round((d.revenue  / max) * 120);
          const expH = Math.round((d.expenses / max) * 120);
          return (
            <div key={d.month} className="flex-1 flex flex-col items-center">
              <div className="w-full flex items-end gap-px justify-center" style={{ height: 120 }}>
                <div title={`إيرادات: ${d.revenue.toLocaleString("ar-DZ")}`}  className="w-5/12 rounded-t-sm bg-rose-400"   style={{ height: Math.max(revH, d.revenue  > 0 ? 2 : 0) }} />
                <div title={`مصاريف: ${d.expenses.toLocaleString("ar-DZ")}`} className="w-5/12 rounded-t-sm bg-orange-300" style={{ height: Math.max(expH, d.expenses > 0 ? 2 : 0) }} />
              </div>
              <span className="text-[8px] text-gray-400 mt-1">{MONTHS_AR[d.month-1].slice(0,3)}</span>
              {d.bookings_count > 0 && (
                <span className={`text-[7px] font-bold ${d.net_profit >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {d.net_profit >= 0 ? "+" : ""}{Math.round(d.net_profit / 1000)}k
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex gap-4 mt-3 pt-2 border-t border-gray-100 text-[10px] text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-rose-400 inline-block"/>إيرادات</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-orange-300 inline-block"/>مصاريف</span>
      </div>
    </div>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({ icon, label, value, sub, valueColor }: { icon: React.ReactNode; label: string; value: string; sub?: string; valueColor?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 text-gray-500">{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-400 font-medium">{label}</p>
        <p className={`text-lg font-bold mt-0.5 leading-tight ${valueColor ?? "text-gray-800"}`}>{value}</p>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Small panel list ─────────────────────────────────────────────────────────

function MiniPanel({ title, icon, rows, emptyText }: {
  title: string; icon: React.ReactNode;
  rows: { label: string; value: string; sub?: string }[];
  emptyText?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col h-full">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">{icon}{title}</h3>
      {rows.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-4">{emptyText ?? "لا توجد بيانات"}</p>
      ) : (
        <div className="space-y-1 flex-1">
          {rows.map((r, i) => (
            <div key={i} className={`flex items-center justify-between gap-2 py-1.5 ${i < rows.length - 1 ? "border-b border-gray-50" : ""}`}>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] text-gray-400 shrink-0 w-4 text-center">{i + 1}</span>
                <div className="min-w-0">
                  <p className="text-xs text-gray-700 truncate">{r.label}</p>
                  {r.sub && <p className="text-[10px] text-gray-400">{r.sub}</p>}
                </div>
              </div>
              <span className="text-xs font-bold text-rose-600 shrink-0">{r.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Top items card ───────────────────────────────────────────────────────────

function TopItemsCard({ title, icon, items, fmt, fmtN }: {
  title: string; icon: React.ReactNode; items: ReportItem[];
  fmt: (n: number) => string; fmtN: (n: number) => string;
}) {
  return (
    <div className="border border-gray-100 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">{icon}{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">لا توجد بيانات</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-2 py-1.5 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 text-[10px] font-bold flex items-center justify-center shrink-0">{i+1}</span>
                <span className="text-sm text-gray-700 truncate">{item.item_name}</span>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-bold text-rose-600">{fmt(item.revenue)}</div>
                <div className="text-[10px] text-gray-400">{fmtN(item.uses ?? item.bookings_count)} مرة</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tables ───────────────────────────────────────────────────────────────────

function BookingsTable({ bookings, fmt }: { bookings: ReportBooking[]; fmt: (n:number)=>string }) {
  if (!bookings.length) return <EmptyState text="لا توجد حجوزات لهذه الفترة" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="text-xs text-gray-400 border-b bg-gray-50/50">
          <th className="text-right px-3 py-2 font-medium">العميل</th>
          <th className="text-right px-3 py-2 font-medium">التاريخ</th>
          <th className="text-right px-3 py-2 font-medium">الإيرادات</th>
          <th className="text-right px-3 py-2 font-medium">مصاريف الحجز</th>
          <th className="text-right px-3 py-2 font-medium">تكلفة العمال</th>
          <th className="text-right px-3 py-2 font-medium">صافي الربح</th>
          <th className="text-right px-3 py-2 font-medium">الحالة</th>
        </tr></thead>
        <tbody>
          {bookings.map(b => (
            <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/50">
              <td className="px-3 py-2.5"><p className="font-semibold text-gray-800">{b.client_name}</p><p className="text-[10px] text-gray-400">{b.client_phone}</p></td>
              <td className="px-3 py-2.5 text-xs text-gray-500">{b.days?.[0] ? new Date(b.days[0]+"T12:00:00").toLocaleDateString("ar-DZ",{month:"short",day:"numeric"}) : "—"}{b.days?.length > 1 && <span className="text-gray-400"> (+{b.days.length-1})</span>}</td>
              <td className="px-3 py-2.5 font-semibold text-green-600 text-xs">{fmt(b.revenue)}</td>
              <td className="px-3 py-2.5 text-orange-500 text-xs">{fmt(b.booking_expenses)}</td>
              <td className="px-3 py-2.5 text-blue-500 text-xs">{fmt(b.worker_costs)}</td>
              <td className={`px-3 py-2.5 font-bold text-xs ${b.net_profit >= 0 ? "text-green-700" : "text-red-600"}`}>{fmt(b.net_profit)}</td>
              <td className="px-3 py-2.5"><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[b.status] ?? "bg-gray-100 text-gray-600"}`}>{STATUS_LABELS[b.status] ?? b.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ItemsTable({ items, label, fmt, fmtN }: { items: ReportItem[]; label: string; fmt:(n:number)=>string; fmtN:(n:number)=>string }) {
  if (!items.length) return <EmptyState text="لا توجد بيانات" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="text-xs text-gray-400 border-b bg-gray-50/50">
          <th className="text-right px-4 py-2 font-medium">#</th>
          <th className="text-right px-4 py-2 font-medium">{label}</th>
          <th className="text-right px-4 py-2 font-medium">الحجوزات</th>
          <th className="text-right px-4 py-2 font-medium">الكمية</th>
          <th className="text-right px-4 py-2 font-medium">الإيرادات</th>
        </tr></thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={item.item_id} className="border-b border-gray-50 hover:bg-gray-50/50">
              <td className="px-4 py-2.5 text-gray-400 text-xs">{i+1}</td>
              <td className="px-4 py-2.5 font-semibold text-gray-800">{item.item_name}</td>
              <td className="px-4 py-2.5 text-gray-600 text-xs">{fmtN(item.bookings_count)} حجز</td>
              <td className="px-4 py-2.5 text-gray-600 text-xs">{fmtN(item.total_qty)}</td>
              <td className="px-4 py-2.5 font-bold text-rose-600 text-xs">{fmt(item.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-12 text-gray-400">
      <svg className="mx-auto w-9 h-9 opacity-20 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
      <p className="text-sm">{text}</p>
    </div>
  );
}

function LoadingRows() {
  return <div className="space-y-2">{Array.from({length:5}).map((_,i)=><div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse"/>)}</div>;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type PeriodType = "daily" | "monthly" | "annual";
type TabType    = "summary" | "bookings" | "products" | "services" | "workers";

export default function ReportsPage() {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const [periodType,    setPeriodType]   = useState<PeriodType>("monthly");
  const [selDate,       setSelDate]      = useState(todayStr);
  const [selYear,       setSelYear]      = useState(today.getFullYear());
  const [selMonth,      setSelMonth]     = useState(today.getMonth() + 1);
  const [hideNumbers,   setHideNumbers]  = useState(false);
  const [activeTab,     setActiveTab]    = useState<TabType>("summary");
  const [loading,       setLoading]      = useState(false);
  const [tabLoading,    setTabLoading]   = useState(false);

  // Summary data
  const [summary,       setSummary]      = useState<FinancialSummary | null>(null);
  const [annualMonthly, setAnnualMonthly]= useState<MonthlyData[]>([]);
  const [topProducts,   setTopProducts]  = useState<ReportItem[]>([]);
  const [topServices,   setTopServices]  = useState<ReportItem[]>([]);
  const [dailyBreakdown,setDailyBreakdown]=useState<DailyData[]>([]);
  const [topBookings,   setTopBookings]  = useState<ReportBooking[]>([]);
  const [expenseNames,  setExpenseNames] = useState<ExpenseName[]>([]);
  const [topInvoices,   setTopInvoices]  = useState<TopInvoice[]>([]);
  const [dailyBookings, setDailyBookings]= useState<ReportBooking[]>([]);

  // Tab data
  const [bookings,      setBookings]     = useState<ReportBooking[]>([]);
  const [bookingsPage,  setBookingsPage] = useState(1);
  const [bookingsLast,  setBookingsLast] = useState(1);
  const [bookingStatus, setBookingStatus]= useState("");
  const [products,      setProducts]     = useState<ReportItem[]>([]);
  const [services,      setServices]     = useState<ReportItem[]>([]);
  const [workers,       setWorkers]      = useState<ReportWorker[]>([]);

  const { dateFrom, dateTo } = useMemo(() => {
    if (periodType === "daily") return { dateFrom: selDate, dateTo: selDate };
    if (periodType === "monthly") {
      const last = new Date(selYear, selMonth, 0).getDate();
      return { dateFrom: `${selYear}-${String(selMonth).padStart(2,"0")}-01`, dateTo: `${selYear}-${String(selMonth).padStart(2,"0")}-${String(last).padStart(2,"0")}` };
    }
    return { dateFrom: `${selYear}-01-01`, dateTo: `${selYear}-12-31` };
  }, [periodType, selDate, selYear, selMonth]);

  const fmt  = (n: number) => hideNumbers ? "••••••" : n.toLocaleString("ar-DZ") + " د.م";
  const fmtN = (n: number) => hideNumbers ? "••" : n.toString();

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (periodType === "daily")        res = await reportsApi.daily(selDate);
      else if (periodType === "monthly") res = await reportsApi.monthly(selYear, selMonth);
      else                               res = await reportsApi.annual(selYear);
      const d = res.data;
      setSummary({ revenue: d.revenue, booking_expenses: d.booking_expenses, worker_costs: d.worker_costs, invoices: d.invoices, total_expenses: d.total_expenses, net_profit: d.net_profit, bookings_count: d.bookings_count });
      if (periodType === "annual")  { setAnnualMonthly(d.monthly ?? []); }
      if (periodType === "monthly") { setTopProducts(d.top_products ?? []); setTopServices(d.top_services ?? []); setDailyBreakdown(d.daily_breakdown ?? []); setTopBookings(d.top_bookings ?? []); setExpenseNames(d.expense_names ?? []); setTopInvoices(d.top_invoices ?? []); }
      if (periodType === "daily")   { setDailyBookings(d.bookings ?? []); }
    } catch {} finally { setLoading(false); }
  }, [periodType, selDate, selYear, selMonth]);

  const fetchTabData = useCallback(async () => {
    if (activeTab === "summary") return;
    setTabLoading(true);
    try {
      if (activeTab === "bookings") {
        const res = await reportsApi.bookings({ date_from: dateFrom, date_to: dateTo, status: bookingStatus || undefined, page: bookingsPage });
        setBookings(res.data.data); setBookingsLast(res.data.last_page);
      } else if (activeTab === "products") {
        const res = await reportsApi.products({ date_from: dateFrom, date_to: dateTo }); setProducts(res.data);
      } else if (activeTab === "services") {
        const res = await reportsApi.services({ date_from: dateFrom, date_to: dateTo }); setServices(res.data);
      } else if (activeTab === "workers") {
        const res = await reportsApi.workers({ date_from: dateFrom, date_to: dateTo }); setWorkers(res.data);
      }
    } catch {} finally { setTabLoading(false); }
  }, [activeTab, dateFrom, dateTo, bookingStatus, bookingsPage]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  useEffect(() => { fetchTabData(); }, [fetchTabData]);
  useEffect(() => { setBookingsPage(1); }, [dateFrom, dateTo, bookingStatus]);

  const exportCSV = () => {
    let content = ""; let filename = "report";
    if (activeTab === "bookings")  { filename = "bookings"; content = "اسم العميل,الحالة,التاريخ,الإيرادات,مصاريف الحجز,تكلفة العمال,صافي الربح\n" + bookings.map(b => [b.client_name, STATUS_LABELS[b.status] ?? b.status, b.days?.[0]??"", b.revenue, b.booking_expenses, b.worker_costs, b.net_profit].join(",")).join("\n"); }
    if (activeTab === "products")  { filename = "products"; content = "المنتج,الحجوزات,الكمية,الإيرادات\n" + products.map(p => [p.item_name, p.bookings_count, p.total_qty, p.revenue].join(",")).join("\n"); }
    if (activeTab === "services")  { filename = "services"; content = "الخدمة,الحجوزات,الكمية,الإيرادات\n" + services.map(s => [s.item_name, s.bookings_count, s.total_qty, s.revenue].join(",")).join("\n"); }
    if (activeTab === "workers")   { filename = "workers";  content = "العامل,الحجوزات,إجمالي التكلفة\n" + workers.map(w => [w.worker_name, w.bookings_count, w.total_cost].join(",")).join("\n"); }
    if (!content) return;
    const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `${filename}-${dateFrom}.csv` });
    a.click(); URL.revokeObjectURL(a.href);
  };

  const years = Array.from({ length: 6 }, (_, i) => today.getFullYear() - 2 + i);
  const avgProfit = summary && summary.bookings_count > 0 ? Math.round(summary.net_profit / summary.bookings_count) : 0;
  const profitMargin = summary && summary.revenue > 0 ? ((summary.net_profit / summary.revenue) * 100).toFixed(1) : "0";

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-5">

      {/* Header + Controls */}
      <div className="flex flex-col gap-4 print:hidden">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">التقارير</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setHideNumbers(v => !v)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-gray-300 transition-colors">
              {hideNumbers ? <EyeOff size={14}/> : <Eye size={14}/>}
              {hideNumbers ? "إظهار الأرقام" : "إخفاء الأرقام"}
            </button>
            <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-gray-300 transition-colors">
              <Download size={14}/>تصدير CSV
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-gray-300 transition-colors">
              <Printer size={14}/>طباعة
            </button>
          </div>
        </div>

        {/* Period selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {(["daily","monthly","annual"] as PeriodType[]).map(t => (
              <button key={t} onClick={() => setPeriodType(t)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${periodType === t ? "bg-rose-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                {t === "daily" ? "اليوم" : t === "monthly" ? "الشهر" : "السنة"}
              </button>
            ))}
          </div>
          {periodType === "daily" && (
            <input type="date" value={selDate} onChange={e => setSelDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-400" />
          )}
          {periodType === "monthly" && (
            <>
              <select value={selMonth} onChange={e => setSelMonth(+e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-400">
                {MONTHS_AR.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
              <select value={selYear} onChange={e => setSelYear(+e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-400">
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </>
          )}
          {periodType === "annual" && (
            <select value={selYear} onChange={e => setSelYear(+e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-400">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">{Array.from({length:5}).map((_,i)=><div key={i} className="bg-gray-100 rounded-xl h-20 animate-pulse"/>)}</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <SummaryCard icon={<TrendingUp size={18}/>}   label="إجمالي الإيرادات"   value={fmt(summary?.revenue ?? 0)}        sub={`${fmtN(summary?.bookings_count ?? 0)} حجز`} valueColor="text-green-600" />
          <SummaryCard icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>} label="إجمالي المصاريف" value={fmt(summary?.total_expenses ?? 0)} sub="حجوزات + فواتير + عمال" valueColor="text-orange-600" />
          <SummaryCard icon={<TrendingDown size={18}/>} label="صافي الربح"          value={fmt(summary?.net_profit ?? 0)}     valueColor={summary && summary.net_profit < 0 ? "text-red-600" : "text-green-700"} sub={`هامش الربح: %${hideNumbers ? "••" : profitMargin}`} />
          <SummaryCard icon={<CalendarDays size={18}/>} label="عدد الحجوزات"        value={fmtN(summary?.bookings_count ?? 0)} sub={dateFrom === dateTo ? dateFrom : `${dateFrom} → ${dateTo}`} />
          <SummaryCard icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>} label="متوسط ربح الحجز" value={fmt(avgProfit)} sub="صافي الربح ÷ عدد الحجوزات" />
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="flex border-b border-gray-100 overflow-x-auto print:hidden">
          {([["summary","ملخص مالي"],["bookings","الحجوزات"],["products","المنتجات"],["services","الخدمات"],["workers","العمال"]] as [TabType, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === key ? "border-rose-500 text-rose-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="p-4">

          {/* ── Summary Tab ── */}
          {activeTab === "summary" && (
            <div className="space-y-4">

              {/* Monthly: 3-col middle row */}
              {periodType === "monthly" && (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Expense Donut */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">ملخص المصاريف</h3>
                      <div className="flex items-center gap-4">
                        <DonutChart segments={[
                          { label: "فواتير المحل",    value: summary?.invoices          ?? 0, color: "#a78bfa" },
                          { label: "مصاريف الحجوزات", value: summary?.booking_expenses  ?? 0, color: "#fb923c" },
                          { label: "تكلفة العمال",    value: summary?.worker_costs      ?? 0, color: "#60a5fa" },
                        ]} />
                        <div className="space-y-2 flex-1 text-xs">
                          {[
                            { label: "فواتير المحل",    value: summary?.invoices         ?? 0, color: "bg-violet-400" },
                            { label: "مصاريف الحجوزات", value: summary?.booking_expenses ?? 0, color: "bg-orange-400" },
                            { label: "تكلفة العمال",    value: summary?.worker_costs     ?? 0, color: "bg-blue-400"  },
                          ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between gap-2">
                              <span className="flex items-center gap-1.5"><span className={`w-2.5 h-2.5 rounded-full inline-block ${item.color}`}/>{item.label}</span>
                              <span className="font-semibold text-gray-700 text-right">{fmt(item.value)}</span>
                            </div>
                          ))}
                          <div className="border-t border-gray-100 pt-2 flex items-center justify-between font-bold text-gray-800">
                            <span>الإجمالي</span><span>{fmt(summary?.total_expenses ?? 0)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Line Chart */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-gray-700">الإيرادات vs المصاريف</h3>
                        <div className="flex gap-3 text-[10px] text-gray-500">
                          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-emerald-500 inline-block rounded"/>إيرادات</span>
                          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-400 inline-block rounded"/>مصاريف</span>
                        </div>
                      </div>
                      <LineChart data={dailyBreakdown} />
                    </div>

                    {/* Profitability panel */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3">
                      <h3 className="text-sm font-semibold text-gray-700">تفاصيل الربحية</h3>
                      {[
                        { label: "إجمالي الإيرادات", value: fmt(summary?.revenue ?? 0),       color: "text-green-600" },
                        { label: "إجمالي المصاريف",  value: fmt(summary?.total_expenses ?? 0), color: "text-orange-500" },
                        { label: "صافي الربح",        value: fmt(summary?.net_profit ?? 0),     color: summary && summary.net_profit < 0 ? "text-red-600" : "text-green-700" },
                      ].map((row, i) => (
                        <div key={i} className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                          <span className="text-xs text-gray-500">{row.label}</span>
                          <span className={`text-sm font-bold ${row.color}`}>{row.value}</span>
                        </div>
                      ))}
                      <div className="mt-auto pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">هامش الربح</span>
                          <span className={`text-2xl font-black ${parseFloat(profitMargin) >= 0 ? "text-green-600" : "text-red-500"}`}>
                            {hideNumbers ? "••%" : `%${profitMargin}`}
                          </span>
                        </div>
                        {!hideNumbers && (
                          <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${parseFloat(profitMargin) >= 0 ? "bg-green-500" : "bg-red-400"}`}
                              style={{ width: `${Math.min(Math.max(parseFloat(profitMargin), 0), 100)}%` }} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom 4-col panels */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MiniPanel
                      title="أعلى الحجوزات ربحاً"
                      icon={<TrendingUp size={14} className="text-rose-500"/>}
                      rows={topBookings.map(b => ({ label: b.client_name, value: fmt(b.net_profit), sub: b.days?.[0] ? new Date(b.days[0]+"T12:00:00").toLocaleDateString("ar-DZ",{month:"short",day:"numeric"}) : "" }))}
                    />
                    <MiniPanel
                      title="مصاريف الحجوزات"
                      icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-orange-500"><path d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/></svg>}
                      rows={expenseNames.map(e => ({ label: e.name, value: fmt(e.total) }))}
                    />
                    <MiniPanel
                      title="تكلفة العمال"
                      icon={<Users size={14} className="text-blue-500"/>}
                      rows={[
                        { label: "إجمالي التكلفة",   value: fmt(summary?.worker_costs ?? 0) },
                        { label: "عدد الحجوزات",     value: fmtN(summary?.bookings_count ?? 0) + " حجز" },
                        { label: "متوسط تكلفة حجز",  value: fmt(summary && summary.bookings_count > 0 ? Math.round(summary.worker_costs / summary.bookings_count) : 0) },
                      ]}
                    />
                    <MiniPanel
                      title="فواتير المحل"
                      icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-violet-500"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
                      rows={topInvoices.map(inv => ({ label: inv.supplier, value: fmt(inv.total_amount), sub: inv.invoice_date ? new Date(inv.invoice_date+"T12:00:00").toLocaleDateString("ar-DZ",{month:"short",day:"numeric"}) : "" }))}
                    />
                  </div>

                  {/* Top products + services */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <TopItemsCard title="أكثر المنتجات استعمالاً" icon={<Package size={14}/>}  items={topProducts} fmt={fmt} fmtN={fmtN} />
                    <TopItemsCard title="أكثر الخدمات طلباً"      icon={<Sparkles size={14}/>} items={topServices} fmt={fmt} fmtN={fmtN} />
                  </div>
                </>
              )}

              {/* Annual: bar chart + table */}
              {periodType === "annual" && annualMonthly.length > 0 && (
                <>
                  <MonthlyBarChart data={annualMonthly} />
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="text-xs text-gray-400 border-b bg-gray-50/50">
                        <th className="text-right px-4 py-2 font-medium">الشهر</th>
                        <th className="text-right px-4 py-2 font-medium">الحجوزات</th>
                        <th className="text-right px-4 py-2 font-medium">الإيرادات</th>
                        <th className="text-right px-4 py-2 font-medium">المصاريف</th>
                        <th className="text-right px-4 py-2 font-medium">صافي الربح</th>
                      </tr></thead>
                      <tbody>
                        {annualMonthly.map(d => (
                          <tr key={d.month} className="border-b border-gray-50 hover:bg-gray-50/50">
                            <td className="px-4 py-2.5 font-medium text-gray-700">{MONTHS_AR[d.month-1]}</td>
                            <td className="px-4 py-2.5 text-gray-600">{fmtN(d.bookings_count)}</td>
                            <td className="px-4 py-2.5 font-semibold text-green-600">{fmt(d.revenue)}</td>
                            <td className="px-4 py-2.5 text-orange-500">{fmt(d.expenses)}</td>
                            <td className={`px-4 py-2.5 font-bold ${d.net_profit >= 0 ? "text-green-700" : "text-red-600"}`}>{fmt(d.net_profit)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Daily: booking list */}
              {periodType === "daily" && <BookingsTable bookings={dailyBookings} fmt={fmt} />}
            </div>
          )}

          {/* ── Bookings Tab ── */}
          {activeTab === "bookings" && (
            <div className="space-y-3">
              <div className="flex gap-3 print:hidden">
                <select value={bookingStatus} onChange={e => setBookingStatus(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-400">
                  <option value="">جميع الحالات</option>
                  {Object.entries(STATUS_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              {tabLoading ? <LoadingRows /> : <BookingsTable bookings={bookings} fmt={fmt} />}
              {bookingsLast > 1 && (
                <div className="flex items-center justify-between pt-2 print:hidden">
                  <span className="text-xs text-gray-500">الصفحة {bookingsPage} / {bookingsLast}</span>
                  <div className="flex gap-2">
                    <button onClick={() => setBookingsPage(p => Math.max(1,p-1))} disabled={bookingsPage===1} className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40"><ChevronRight size={14}/></button>
                    <button onClick={() => setBookingsPage(p => Math.min(bookingsLast,p+1))} disabled={bookingsPage===bookingsLast} className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40"><ChevronLeft size={14}/></button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Products Tab ── */}
          {activeTab === "products" && (tabLoading ? <LoadingRows /> : <ItemsTable items={products} label="المنتج" fmt={fmt} fmtN={fmtN} />)}

          {/* ── Services Tab ── */}
          {activeTab === "services" && (tabLoading ? <LoadingRows /> : <ItemsTable items={services} label="الخدمة" fmt={fmt} fmtN={fmtN} />)}

          {/* ── Workers Tab ── */}
          {activeTab === "workers" && (
            tabLoading ? <LoadingRows /> :
            workers.length === 0 ? <EmptyState text="لا يوجد عمال لهذه الفترة" /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-xs text-gray-400 border-b bg-gray-50/50">
                    <th className="text-right px-4 py-2 font-medium">اسم العامل</th>
                    <th className="text-right px-4 py-2 font-medium">الحجوزات</th>
                    <th className="text-right px-4 py-2 font-medium">إجمالي التكلفة</th>
                  </tr></thead>
                  <tbody>
                    {workers.map((w, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-semibold text-gray-800">{w.worker_name}</td>
                        <td className="px-4 py-3 text-gray-600 text-sm">{fmtN(w.bookings_count)} حجز</td>
                        <td className="px-4 py-3 font-bold text-blue-600">{fmt(w.total_cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
