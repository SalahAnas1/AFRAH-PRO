"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Search, Bell, Settings, TrendingUp, TrendingDown,
  Store, CheckCircle, XCircle, AlertCircle, CalendarDays,
  Wallet, TriangleAlert, Info, Activity, Plus, Edit, Trash2, FileText, Users,
} from "lucide-react";
import { superAdminApi } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiStats {
  businesses: { total: number; active: number; disabled: number; expiring_soon: number; expired: number };
  owners: number;
  bookings_total: number;
  products_total: number;
  services_total: number;
  workers_total: number;
  invoices_total: number;
  revenue: number;
  expenses_bookings: number;
  expenses_workers: number;
  expenses_invoices: number;
  net_profit: number;
  recent_businesses: { id: number; name: string; city: string; created_at: string; status: string; bookings_count: number }[];
  top_businesses: { id: number; name: string; city: string; status: string; bookings_count: number }[];
}

// ─── Static Data ──────────────────────────────────────────────────────────────

const MONTHLY_DATA = [
  { month: "يناير", bookings: 450 },
  { month: "فبراير", bookings: 620 },
  { month: "مارس",  bookings: 580 },
  { month: "أبريل", bookings: 720 },
  { month: "مايو",  bookings: 850 },
  { month: "يونيو", bookings: 980 },
];

const ALERTS = [
  { type: "warning" as const, icon: TriangleAlert, color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100", message: "مخزون منخفض في قاعة الورود",               time: "منذ 10 دقائق" },
  { type: "info"    as const, icon: Info,          color: "text-blue-500",   bg: "bg-blue-50",   border: "border-blue-100",   message: "اشتراك ليالي الأفراح سينتهي خلال 3 أيام", time: "منذ ساعة"     },
  { type: "error"   as const, icon: XCircle,       color: "text-red-500",    bg: "bg-red-50",    border: "border-red-100",    message: "فشل النسخ الاحتياطي — يرجى المراجعة",      time: "منذ ساعتين"   },
  { type: "success" as const, icon: CheckCircle,   color: "text-green-500",  bg: "bg-green-50",  border: "border-green-100",  message: "تم تسجيل محل جديد: قصر المملكة — بركان",  time: "منذ يوم"      },
];

const ACTIVITIES = [
  { icon: Plus,         color: "text-green-600",  bg: "bg-green-50",  action: "إنشاء محل جديد", detail: "قصر المملكة — بركان",       time: "منذ 5 دقائق"  },
  { icon: Edit,         color: "text-blue-600",   bg: "bg-blue-50",   action: "تعديل اشتراك",   detail: "ليالي الأفراح — تم التجديد", time: "منذ 30 دقيقة" },
  { icon: Trash2,       color: "text-red-500",    bg: "bg-red-50",    action: "حذف مستخدم",     detail: "تم حذف حساب مشتبه به",      time: "منذ ساعة"     },
  { icon: CalendarDays, color: "text-violet-600", bg: "bg-violet-50", action: "إنشاء حجز",      detail: "حجز جديد في قاعة الورود",   time: "منذ ساعتين"  },
  { icon: FileText,     color: "text-amber-600",  bg: "bg-amber-50",  action: "إضافة فاتورة",   detail: "فاتورة جديدة رقم #1042",     time: "منذ 3 ساعات"  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) { return n.toLocaleString("ar-DZ"); }
function fmtMoney(n: number) { return n.toLocaleString("ar-DZ", { maximumFractionDigits: 0 }) + " د.م"; }
function pct(part: number, total: number) {
  if (!total) return "0%";
  return ((part / total) * 100).toFixed(1) + "%";
}

// ─── SVG Line Chart ───────────────────────────────────────────────────────────

function LineChart() {
  const W = 460; const H = 140; const pL = 28; const pR = 8; const pT = 10; const pB = 24;
  const cW = W - pL - pR; const cH = H - pT - pB;
  const vals = MONTHLY_DATA.map(d => d.bookings);
  const maxV = Math.max(...vals);
  const x = (i: number) => pL + (i / (vals.length - 1)) * cW;
  const y = (v: number) => pT + (1 - v / maxV) * cH;
  const pts = vals.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const fill = `${x(0)},${pT + cH} ${pts} ${x(vals.length - 1)},${pT + cH}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {[0, maxV / 2, maxV].map((v, i) => (
        <g key={i}>
          <line x1={pL} y1={y(v)} x2={W - pR} y2={y(v)} stroke="#f3f4f6" strokeWidth="1"/>
          <text x={pL - 3} y={y(v) + 3} textAnchor="end" fontSize="7" fill="#d1d5db">{Math.round(v / 100) * 100}</text>
        </g>
      ))}
      <polygon points={fill} fill="rgba(251,191,36,0.10)"/>
      <polyline points={pts} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {vals.map((v, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(v)} r="3.5" fill="#f59e0b" stroke="white" strokeWidth="1.5"/>
          <text x={x(i)} y={H - 6} textAnchor="middle" fontSize="7" fill="#9ca3af">{MONTHLY_DATA[i].month.slice(0, 3)}</text>
        </g>
      ))}
    </svg>
  );
}

// ─── SVG Donut Chart ──────────────────────────────────────────────────────────

function DonutChart({ active, disabled, other }: { active: number; disabled: number; other: number }) {
  const segments = [
    { label: "نشط",  value: active,   color: "#10b981", ring: "#d1fae5" },
    { label: "معطل", value: disabled, color: "#ef4444", ring: "#fee2e2" },
    { label: "معلق", value: other,    color: "#f59e0b", ring: "#fef3c7" },
  ];
  const r = 42; const cx = 60; const cy = 60; const C = 2 * Math.PI * r;
  const GAP = 0.03 * C;
  const total = segments.reduce((s, d) => s + d.value, 0);
  const withOff = segments.reduce<{ result: (typeof segments[0] & { len: number; off: number })[]; cum: number }>(
    (acc, seg) => {
      const raw = total ? (seg.value / total) * C : 0;
      const len = raw > GAP * 2 ? raw - GAP : raw;
      return { result: [...acc.result, { ...seg, len, off: -(acc.cum + GAP / 2) }], cum: acc.cum + raw };
    }, { result: [], cum: 0 }
  ).result;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* دائرة مركزية */}
      <svg viewBox="0 0 120 120" className="w-36 h-36">
        {total === 0 ? (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth="14"/>
        ) : withOff.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth="14"
            strokeDasharray={`${s.len} ${C - s.len}`}
            strokeDashoffset={s.off}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}/>
        ))}
        <text x={cx} y={cy - 7} textAnchor="middle" fill="#111827" fontSize="17" fontWeight="bold">{total}</text>
        <text x={cx} y={cy + 8} textAnchor="middle" fill="#9ca3af" fontSize="7.5">إجمالي</text>
        <text x={cx} y={cy + 18} textAnchor="middle" fill="#9ca3af" fontSize="7.5">المحلات</text>
      </svg>

      {/* أسطورة مع شريط تقدم */}
      <div className="w-full space-y-3">
        {withOff.map((s, i) => {
          const p = total ? +((s.value / total) * 100).toFixed(1) : 0;
          return (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-medium text-gray-700">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }}/>
                  {s.label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-800">{s.value}</span>
                  <span className="text-[10px] text-gray-400 w-8 text-left">{p}%</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: s.ring }}>
                <div className="h-full rounded-full" style={{ width: `${p}%`, backgroundColor: s.color }}/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SuperAdminDashboard() {
  const [searchVal, setSearchVal] = useState("");
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await superAdminApi.dashboard.statistics();
      setStats(res.data);
    } catch {
      setError("فشل تحميل الإحصائيات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const statCards = stats ? [
    { label: "إجمالي المحلات",      value: fmt(stats.businesses.total),   sub: `${stats.owners} صاحب محل`,                                                          icon: Store,        iconBg: "bg-blue-50",    iconColor: "text-blue-600",   valueColor: "text-blue-700"   },
    { label: "المحلات النشطة",      value: fmt(stats.businesses.active),  sub: pct(stats.businesses.active, stats.businesses.total) + " من الإجمالي",                icon: CheckCircle,  iconBg: "bg-green-50",   iconColor: "text-green-600",  valueColor: "text-green-700"  },
    { label: "المحلات المعطلة",     value: fmt(stats.businesses.disabled),sub: "تحتاج مراجعة",                                                                       icon: XCircle,      iconBg: "bg-red-50",     iconColor: "text-red-500",    valueColor: "text-red-600"    },
    { label: "الاشتراكات المنتهية", value: fmt(stats.businesses.expired + stats.businesses.expiring_soon), sub: "تحتاج تجديد",                                       icon: AlertCircle,  iconBg: "bg-orange-50",  iconColor: "text-orange-500", valueColor: "text-orange-600" },
    { label: "إجمالي الحجوزات",     value: fmt(stats.bookings_total),     sub: "جميع المحلات",                                                                       icon: CalendarDays, iconBg: "bg-violet-50",  iconColor: "text-violet-600", valueColor: "text-violet-700" },
    { label: "إجمالي الإيرادات",    value: fmtMoney(stats.revenue),       sub: "الحجوزات المؤكدة والمكتملة",                                                         icon: Wallet,       iconBg: "bg-amber-50",   iconColor: "text-amber-600",  valueColor: "text-amber-700"  },
  ] : [];

  const totalExpenses = stats ? stats.expenses_bookings + stats.expenses_workers + stats.expenses_invoices : 0;

  const financialCards = stats ? [
    { label: "إجمالي الحجوزات",  value: fmt(stats.bookings_total),  icon: CalendarDays, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "إجمالي الإيرادات", value: fmtMoney(stats.revenue),    icon: TrendingUp,   color: "text-green-600",  bg: "bg-green-50"  },
    { label: "إجمالي المصاريف",  value: fmtMoney(totalExpenses),    icon: TrendingDown, color: "text-red-500",    bg: "bg-red-50"    },
    { label: "صافي الأرباح",     value: fmtMoney(stats.net_profit), icon: Wallet,       color: "text-amber-600",  bg: "bg-amber-50"  },
  ] : [];

  const subCards = stats ? [
    { label: "إجمالي المنتجات", value: fmt(stats.products_total), icon: Store,       color: "text-blue-600",   bg: "bg-blue-50"   },
    { label: "إجمالي الخدمات",  value: fmt(stats.services_total), icon: CheckCircle, color: "text-green-600",  bg: "bg-green-50"  },
    { label: "إجمالي العمال",   value: fmt(stats.workers_total),  icon: Users,       color: "text-violet-600", bg: "bg-violet-50" },
    { label: "إجمالي الفواتير", value: fmt(stats.invoices_total), icon: FileText,    color: "text-amber-600",  bg: "bg-amber-50"  },
  ] : [];

  if (loading) return (
    <div className="min-h-screen bg-gray-50/60 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p className="text-gray-500 text-sm">جاري تحميل الإحصائيات...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50/60 flex items-center justify-center">
      <div className="text-center">
        <XCircle size={40} className="text-red-400 mx-auto mb-3"/>
        <p className="text-gray-600 text-sm mb-4">{error}</p>
        <button onClick={fetchStats} className="px-4 py-2 bg-amber-400 text-white rounded-xl text-sm font-semibold hover:bg-amber-500 transition-colors">
          إعادة المحاولة
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/60">

      {/* ── Navbar ── */}
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 h-14 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input value={searchVal} onChange={e => setSearchVal(e.target.value)}
              placeholder="ابحث عن محل، مالك، مدينة..."
              className="border border-gray-200 rounded-xl pr-9 pl-4 py-2 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all w-52 lg:w-64"/>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors">
            <Bell size={17} className="text-amber-500"/>
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">3</span>
          </button>
          <button className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors">
            <Settings size={17} className="text-gray-400"/>
          </button>
          <div className="flex items-center gap-2 pr-2 border-r border-gray-200 mr-1">
            <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center">
              <span className="text-navy text-xs font-bold">SA</span>
            </div>
            <span className="text-sm font-semibold text-gray-700">سوبر أدمن</span>
          </div>
        </div>
      </header>

      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">

        {/* ── Page Title ── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">لوحة تحكم السوبر أدمن</h1>
          <p className="text-sm text-gray-400 mt-1">مرحباً بك في لوحة التحكم الرئيسية لمنصة AFRAH PRO</p>
        </div>

        {/* ── 6 Stat Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {statCards.map((c, i) => {
            const Icon = c.icon;
            return (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl ${c.iconBg} flex items-center justify-center shrink-0`}>
                  <Icon size={18} className={c.iconColor}/>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-400 font-medium leading-tight">{c.label}</p>
                  <p className={`text-lg font-bold mt-0.5 leading-tight ${c.valueColor}`}>{c.value}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{c.sub}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Middle 3-col ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_220px] gap-4">

          {/* Recent businesses */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Store size={14} className="text-amber-500"/>أحدث المحلات</h3>
              <span className="text-[11px] text-amber-500 hover:underline cursor-pointer">عرض الكل</span>
            </div>
            <div className="space-y-2 flex-1">
              {(stats?.recent_businesses ?? []).map(b => (
                <div key={b.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {b.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 truncate">{b.name}</p>
                    <p className="text-[10px] text-gray-400">{b.city} · {b.created_at?.slice(0, 10)}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${b.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                    {b.status === "active" ? "نشط" : "معطل"}
                  </span>
                </div>
              ))}
              {(stats?.recent_businesses ?? []).length === 0 && (
                <p className="text-xs text-gray-400 text-center py-6">لا توجد محلات بعد</p>
              )}
            </div>
          </div>

          {/* Line Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><TrendingUp size={14} className="text-amber-500"/>نمو الحجوزات الشهري</h3>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                <span className="w-3 h-0.5 bg-amber-400 inline-block rounded"/>حجوزات
              </div>
            </div>
            <LineChart/>
            <div className="grid grid-cols-6 mt-1">
              {MONTHLY_DATA.map((d, i) => (
                <div key={i} className="text-center">
                  <p className="text-[10px] font-bold text-gray-700">{d.bookings}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Donut Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Activity size={14} className="text-amber-500"/>توزيع المحلات
            </h3>
            <DonutChart
              active={stats?.businesses.active ?? 0}
              disabled={stats?.businesses.disabled ?? 0}
              other={(stats?.businesses.expiring_soon ?? 0) + (stats?.businesses.expired ?? 0)}
            />
          </div>

        </div>

        {/* ── 4 Financial Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {financialCards.map((c, i) => {
            const Icon = c.icon;
            return (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
                  <Icon size={18} className={c.color}/>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-400">{c.label}</p>
                  <p className={`text-sm font-bold mt-0.5 truncate ${c.color}`}>{c.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Bottom 3-col ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[260px_260px_1fr] gap-4">

          {/* Alerts */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TriangleAlert size={14} className="text-orange-400"/>تنبيهات النظام
            </h3>
            <div className="space-y-2">
              {ALERTS.map((a, i) => {
                const Icon = a.icon;
                return (
                  <div key={i} className={`flex gap-2.5 p-2.5 rounded-xl border ${a.bg} ${a.border}`}>
                    <Icon size={14} className={`${a.color} shrink-0 mt-0.5`}/>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-700 leading-snug">{a.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{a.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Activity size={14} className="text-violet-500"/>النشاط الأخير
            </h3>
            <div className="space-y-3">
              {ACTIVITIES.map((a, i) => {
                const Icon = a.icon;
                return (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className={`w-7 h-7 rounded-lg ${a.bg} flex items-center justify-center shrink-0`}>
                      <Icon size={13} className={a.color}/>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-800">{a.action}</p>
                      <p className="text-[10px] text-gray-400 truncate">{a.detail}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0">{a.time}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Most active businesses table */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp size={14} className="text-green-500"/>أكثر المحلات نشاطاً
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-100 bg-gray-50/50">
                    <th className="text-right px-3 py-2 font-medium">#</th>
                    <th className="text-right px-3 py-2 font-medium">المحل</th>
                    <th className="text-right px-3 py-2 font-medium">المدينة</th>
                    <th className="text-right px-3 py-2 font-medium">الحجوزات</th>
                    <th className="text-right px-3 py-2 font-medium">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats?.top_businesses ?? []).map((b, i) => {
                    const maxB = Math.max(...(stats?.top_businesses ?? []).map(x => x.bookings_count), 1);
                    return (
                      <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-3 py-2.5 text-xs text-gray-400">{i + 1}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 text-[10px] font-bold shrink-0">
                              {b.name.charAt(0)}
                            </div>
                            <span className="text-xs font-semibold text-gray-800">{b.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-gray-500">{b.city}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full max-w-[60px]">
                              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(b.bookings_count / maxB) * 100}%` }}/>
                            </div>
                            <span className="text-xs font-bold text-gray-700">{b.bookings_count}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${b.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                            {b.status === "active" ? "نشط" : "معطل"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {(stats?.top_businesses ?? []).length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-xs text-gray-400 py-6">لا توجد بيانات</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* ── Bottom 4 Sub Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {subCards.map((c, i) => {
            const Icon = c.icon;
            return (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
                  <Icon size={18} className={c.color}/>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400">{c.label}</p>
                  <p className={`text-xl font-bold mt-0.5 ${c.color}`}>{c.value}</p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}