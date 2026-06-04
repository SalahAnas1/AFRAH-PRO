"use client";
import { useLanguage } from "@/context/LanguageContext";
import { useEffect, useState, useCallback } from "react";
import { inventoryApi, productsApi } from "@/lib/api";
import { Product } from "@/types";
import {
  Package, ChevronLeft, ChevronRight, Plus, AlertTriangle,
  ArrowDownCircle, ArrowUpCircle, RotateCcw, SlidersHorizontal,
  Calendar, X, Box,
} from "lucide-react";

interface CalendarDay  { date: string; booking_count: number; }
interface InvProduct   { id: number; name: string; unit: string; stock: number; reserved: number; available: number; category: string | null; }
interface Movement     { id: number; product_id: number; type: "in"|"out"|"return"|"adjustment"; quantity: number; reason: string|null; notes: string|null; created_at: string; product?: { id: number; name: string; unit: string }; }

const MOVE_TYPE_COLORS: Record<string, string> = { in: "bg-green-100 text-green-700", out: "bg-red-100 text-red-700", return: "bg-blue-100 text-blue-700", adjustment: "bg-gray-100 text-gray-700" };
const MOVE_TYPE_ICONS: Record<string, React.ElementType> = { in: ArrowDownCircle, out: ArrowUpCircle, return: RotateCcw, adjustment: SlidersHorizontal };

const REASONS_KEYS: Record<string, string> = { broken: "inventory.reasons.broken", damaged: "inventory.reasons.damaged", lost: "inventory.reasons.lost", sold: "inventory.reasons.sold", consumed: "inventory.reasons.consumed", other: "inventory.reasons.other" };

// calendar via useLanguage context

// ─── Add Movement Modal ───────────────────────────────────────────────────────

function AddMovementModal({ products, onClose, onSuccess }: {
  products: Product[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t, calendar } = useLanguage();
  const [productId, setProductId] = useState<number|"">("");
  const [type,      setType]      = useState<"in"|"out"|"return"|"adjustment">("in");
  const [quantity,  setQuantity]  = useState(1);
  const [reason,    setReason]    = useState("");
  const [notes,     setNotes]     = useState("");
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");

  const submit = async () => {
    if (!productId) { setError(t("inventory.movementModal.errorChooseProduct")); return; }
    if (!quantity || quantity === 0) { setError(t("inventory.movementModal.errorQuantity")); return; }
    setSaving(true); setError("");
    try {
      await inventoryApi.addMovement({ product_id: productId, type, quantity, reason: reason || null, notes: notes || null });
      onSuccess();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "حدث خطأ، حاول مجدداً");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-base">تسجيل حركة مخزن</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          {/* Product */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">المنتج</label>
            <select
              value={productId}
              onChange={e => setProductId(Number(e.target.value) || "")}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-400"
            >
              <option value="">اختر منتجاً...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} — المخزون: {p.stock} {p.unit}</option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-2">نوع الحركة</label>
            <div className="grid grid-cols-4 gap-2">
              {(["in","out","return","adjustment"] as const).map((key) => {
                const MoveIcon = MOVE_TYPE_ICONS[key];
                return (
                  <button
                    key={key}
                    onClick={() => setType(key)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 text-[11px] font-medium transition-colors ${
                      type === key ? "border-rose-500 bg-rose-50 text-rose-700" : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    <MoveIcon size={15} />
                    {t(`inventory.moveTypes.${key}`)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              الكمية {type === "adjustment" && <span className="text-gray-400">(سالب للتخفيض)</span>}
            </label>
            <input
              type="number"
              min={type === "adjustment" ? undefined : 1}
              value={quantity}
              onChange={e => setQuantity(parseInt(e.target.value) || 0)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-400"
            />
          </div>

          {/* Reason */}
          {(type === "out" || type === "adjustment") && (
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">السبب (اختياري)</label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-400"
              >
                <option value="">اختر سبباً...</option>
                {(["broken","damaged","lost","sold","consumed","other"] as const).map(k => <option key={k} value={k}>{t(`inventory.reasons.${k}`)}</option>)}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">ملاحظات</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-400 resize-none"
              placeholder={t("inventory.movementModal.notesPlaceholder")}
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">إلغاء</button>
          <button
            onClick={submit}
            disabled={saving}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            {saving ? "جاري الحفظ..." : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const { t, calendar } = useLanguage();
  const today = new Date();
  const [year,         setYear]         = useState(today.getFullYear());
  const [month,        setMonth]        = useState(today.getMonth() + 1);
  const [calDays,      setCalDays]      = useState<CalendarDay[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [dayProducts,  setDayProducts]  = useState<InvProduct[]>([]);
  const [alerts,       setAlerts]       = useState<Product[]>([]);
  const [movements,    setMovements]    = useState<Movement[]>([]);
  const [movePage,     setMovePage]     = useState(1);
  const [moveLastPage, setMoveLastPage] = useState(1);
  const [allProducts,  setAllProducts]  = useState<Product[]>([]);
  const [showModal,    setShowModal]    = useState(false);
  const [calLoading,   setCalLoading]   = useState(true);
  const [dayLoading,   setDayLoading]   = useState(false);
  const [activeTab,    setActiveTab]    = useState<"movements"|"alerts">("movements");

  const fetchCalendar = useCallback(async () => {
    setCalLoading(true);
    try {
      const res = await inventoryApi.calendar(year, month);
      setCalDays(res.data.days);
    } catch {} finally { setCalLoading(false); }
  }, [year, month]);

  const fetchDayDetail = useCallback(async (date: string) => {
    setDayLoading(true);
    try {
      const res = await inventoryApi.dayDetail(date);
      setDayProducts(res.data.products);
    } catch {} finally { setDayLoading(false); }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try { const res = await inventoryApi.alerts(); setAlerts(res.data); } catch {}
  }, []);

  const fetchMovements = useCallback(async () => {
    try {
      const res = await inventoryApi.movements({ page: movePage, per_page: 15 });
      setMovements(res.data.data);
      setMoveLastPage(res.data.last_page);
    } catch {}
  }, [movePage]);

  const fetchProducts = useCallback(async () => {
    try { const res = await productsApi.list({ per_page: 200 }); setAllProducts(res.data.data); } catch {}
  }, []);

  useEffect(() => { fetchCalendar(); }, [fetchCalendar]);
  useEffect(() => { fetchAlerts(); fetchProducts(); }, [fetchAlerts, fetchProducts]);
  useEffect(() => { fetchMovements(); }, [fetchMovements]);
  useEffect(() => { if (selectedDate) fetchDayDetail(selectedDate); }, [selectedDate, fetchDayDetail]);

  const prevMonth = () => { if (month === 1) { setYear(y => y-1); setMonth(12); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 12) { setYear(y => y+1); setMonth(1); } else setMonth(m => m+1); };

  // Build calendar grid data
  const calMap      = new Map(calDays.map(d => [d.date, d.booking_count]));
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const todayStr    = today.toISOString().split("T")[0];

  const totalProducts = allProducts.length;
  const lowStockCount = alerts.length;
  const todayBookings = calMap.get(todayStr) ?? 0;

  const onModalSuccess = () => {
    setShowModal(false);
    fetchMovements();
    fetchAlerts();
    fetchProducts();
    if (selectedDate) fetchDayDetail(selectedDate);
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">المخزن</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">تسجيل حركة</span>
          <span className="sm:hidden">تسجيل</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-gray-800">{totalProducts}</div>
          <div className="text-xs text-gray-500 mt-1">إجمالي المنتجات</div>
        </div>
        <div className={`rounded-xl border p-4 text-center ${lowStockCount > 0 ? "border-orange-200 bg-orange-50" : "border-gray-200 bg-white"}`}>
          <div className={`text-2xl font-bold ${lowStockCount > 0 ? "text-orange-600" : "text-gray-800"}`}>{lowStockCount}</div>
          <div className="text-xs text-gray-500 mt-1">مخزون منخفض</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{todayBookings}</div>
          <div className="text-xs text-gray-500 mt-1">حجوزات اليوم</div>
        </div>
      </div>

      {/* Calendar + Day Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Calendar */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 p-5">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronRight size={18} className="text-gray-600" />
            </button>
            <span className="font-semibold text-gray-800">{calendar.months[month - 1]} {year}</span>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronLeft size={18} className="text-gray-600" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {calendar.days.map(d => (
              <div key={d} className="text-center text-[10px] font-medium text-gray-400 py-1">{d.slice(0, 3)}</div>
            ))}
          </div>

          {/* Day cells */}
          {calLoading ? (
            <div className="text-center py-10 text-gray-400 text-sm">جاري التحميل...</div>
          ) : (
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day     = i + 1;
                const dateStr = `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                const count   = calMap.get(dateStr) ?? 0;
                const isToday    = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                const dotColor   = count === 0 ? "" : count === 1 ? "bg-amber-400" : count === 2 ? "bg-orange-500" : "bg-red-500";

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(isSelected ? "" : dateStr)}
                    className={`relative flex flex-col items-center justify-center h-10 rounded-lg text-sm font-medium transition-all ${
                      isSelected ? "bg-rose-600 text-white" :
                      isToday    ? "bg-rose-50 text-rose-700 font-bold" :
                      "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    {day}
                    {count > 0 && (
                      <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white/70" : dotColor}`} />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-[10px] text-gray-500 flex-wrap">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />حجز واحد</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />حجزان</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />٣ فأكثر</span>
          </div>
        </div>

        {/* Day Detail Panel */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-5">
          {!selectedDate ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[260px] text-center text-gray-400">
              <Calendar size={42} className="mb-3 opacity-25" />
              <p className="text-sm font-medium">اختر يوماً من التقويم</p>
              <p className="text-xs mt-1 text-gray-300">لعرض المنتجات المحجوزة وتوفرها</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 text-sm">
                  {new Date(selectedDate + "T12:00:00").toLocaleDateString(calendar.locale, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </h3>
                <button onClick={() => setSelectedDate("")} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={16} />
                </button>
              </div>

              {dayLoading ? (
                <div className="text-center py-8 text-gray-400 text-sm">جاري التحميل...</div>
              ) : dayProducts.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Box size={36} className="mx-auto mb-2 opacity-25" />
                  <p className="text-sm">لا توجد منتجات في هذا اليوم</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {dayProducts.map(p => (
                    <div key={p.id} className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 px-3 py-2.5 hover:border-gray-200 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                        {p.category && <p className="text-[10px] text-gray-400">{p.category}</p>}
                      </div>
                      <div className="flex items-center gap-2 text-xs shrink-0">
                        {p.reserved > 0 && (
                          <span className="text-gray-500">محجوز: <b className="text-orange-600">{p.reserved}</b></span>
                        )}
                        <span className={`font-semibold px-2 py-0.5 rounded-full ${
                          p.available === 0 ? "bg-red-100 text-red-700" :
                          p.available <= 2  ? "bg-amber-100 text-amber-700" :
                          "bg-green-100 text-green-700"
                        }`}>
                          {p.available} {p.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Bottom: Movements + Alerts tabs */}
      <div className="bg-white rounded-2xl border border-gray-200">

        {/* Tab headers */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab("movements")}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "movements" ? "border-rose-500 text-rose-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            سجل الحركات
          </button>
          <button
            onClick={() => setActiveTab("alerts")}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "alerts" ? "border-rose-500 text-rose-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            تنبيهات المخزون
            {lowStockCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] flex items-center justify-center font-bold">
                {lowStockCount}
              </span>
            )}
          </button>
        </div>

        {/* Movements */}
        {activeTab === "movements" && (
          movements.length === 0 ? (
            <div className="text-center py-14 text-gray-400">
              <Package size={42} className="mx-auto mb-3 opacity-25" />
              <p className="text-sm">لا توجد حركات مسجلة بعد</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b border-gray-100 bg-gray-50/50">
                      <th className="text-right px-4 py-3 font-medium">المنتج</th>
                      <th className="text-right px-4 py-3 font-medium">النوع</th>
                      <th className="text-right px-4 py-3 font-medium">الكمية</th>
                      <th className="text-right px-4 py-3 font-medium">السبب</th>
                      <th className="text-right px-4 py-3 font-medium">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map(m => {
                      const mtColor = MOVE_TYPE_COLORS[m.type] ?? "bg-gray-100 text-gray-700";
                      const MtIcon  = MOVE_TYPE_ICONS[m.type] ?? ArrowDownCircle;
                      const sign    = m.type === "out" ? "−" : "+";
                      return (
                        <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-800">{m.product?.name ?? `#${m.product_id}`}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${mtColor}`}>
                              <MtIcon size={11} />
                              {t(`inventory.moveTypes.${m.type}`)}
                            </span>
                          </td>
                          <td className={`px-4 py-3 font-bold text-sm ${m.type === "out" ? "text-red-600" : "text-green-600"}`}>
                            {sign}{Math.abs(m.quantity)} {m.product?.unit ?? ""}
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{m.reason ? t("inventory.reasons." + m.reason) ?? m.reason : "—"}</td>
                          <td className="px-4 py-3 text-gray-400 text-xs">
                            {new Date(m.created_at).toLocaleDateString(calendar.locale, { year: "numeric", month: "short", day: "numeric" })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {moveLastPage > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">الصفحة {movePage} / {moveLastPage}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMovePage(p => Math.max(1, p-1))}
                      disabled={movePage === 1}
                      className="p-1.5 rounded-lg border border-gray-200 hover:border-rose-300 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronRight size={14} />
                    </button>
                    <button
                      onClick={() => setMovePage(p => Math.min(moveLastPage, p+1))}
                      disabled={movePage === moveLastPage}
                      className="p-1.5 rounded-lg border border-gray-200 hover:border-rose-300 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )
        )}

        {/* Alerts */}
        {activeTab === "alerts" && (
          <div className="p-4">
            {alerts.length === 0 ? (
              <div className="text-center py-14 text-gray-400">
                <Package size={42} className="mx-auto mb-3 opacity-25" />
                <p className="text-sm">جميع المنتجات بمخزون كافٍ</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {alerts.map(p => (
                  <div
                    key={p.id}
                    className={`rounded-xl border p-4 flex items-center gap-3 ${
                      p.stock === 0 ? "border-red-200 bg-red-50" : "border-orange-200 bg-orange-50"
                    }`}
                  >
                    <AlertTriangle
                      size={20}
                      className={`shrink-0 ${p.stock === 0 ? "text-red-500" : "text-orange-500"}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                      <p className={`text-xl font-bold mt-0.5 ${p.stock === 0 ? "text-red-600" : "text-orange-600"}`}>
                        {p.stock} <span className="text-xs font-normal text-gray-500">{p.unit}</span>
                      </p>
                      {p.stock === 0 && <p className="text-[10px] text-red-500 font-medium mt-0.5">نفد المخزون</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <AddMovementModal
          products={allProducts}
          onClose={() => setShowModal(false)}
          onSuccess={onModalSuccess}
        />
      )}
    </div>
  );
}
