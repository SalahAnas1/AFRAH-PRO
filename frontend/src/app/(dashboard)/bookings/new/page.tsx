"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { bookingsApi, servicesApi, productsApi, workersApi } from "@/lib/api";
import type { Service, ServiceCategory, Product, ProductCategory, Worker, Booking } from "@/types";
import Topbar from "@/components/layout/Topbar";
import {
  Plus, Trash2, Phone, MapPin, Calendar, Package,
  Users, ReceiptText, CheckCircle, Search, Check,
  ImageIcon, Save, ChevronRight, ZoomIn,
} from "lucide-react";
import { ImagePreviewModal } from "@/components/ui/ImagePreviewModal";
import { useLanguage } from "@/context/LanguageContext";

interface WizardDay { date: string }
interface WizardItem {
  day_index: number | null;
  item_type: "product" | "service";
  item_id: number;
  item_name: string;
  item_image: string | null;
  quantity: number;
  unit_price: number;
  original_price: number;
}
interface WizardWorker {
  worker_id: number | null;
  worker_name: string;
  worker_image: string | null;
  cost: number;
  day_indices: number[];
  task: string;
}
interface WizardExpense {
  name: string;
  quantity: number;
  unit_price: number;
  day_index: number | null;
}

const DAY = [
  { badge: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-400" },
  { badge: "bg-blue-100 text-blue-700 border-blue-200",   dot: "bg-blue-400"  },
  { badge: "bg-green-100 text-green-700 border-green-200",dot: "bg-green-400" },
  { badge: "bg-purple-100 text-purple-700 border-purple-200", dot: "bg-purple-400" },
  { badge: "bg-rose-100 text-rose-700 border-rose-200",   dot: "bg-rose-400"  },
];
const dayClr = (i: number) => DAY[i % DAY.length];

const weekday  = (d: string) => { try { return new Date(d).toLocaleDateString("ar-DZ",{ weekday:"long" }); } catch { return ""; } };
const monthDay = (d: string) => { try { return new Date(d).toLocaleDateString("ar-DZ",{ month:"long", day:"numeric" }); } catch { return d; } };
const fullDate = (d: string) => { try { return new Date(d).toLocaleDateString("ar-DZ",{ weekday:"long", year:"numeric", month:"long", day:"numeric" }); } catch { return d; } };
const fmtC    = (n: number)  => n.toLocaleString("ar-DZ", { minimumFractionDigits: 2 });
const imgSrc  = (p: string | null): string | null => {
  if (!p) return null;
  if (p.startsWith("http")) return p;
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api").replace("/api","");
  return `${base}/storage/${p}`;
};

function DayBookingCount({ date }: { date: string }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!date) { setCount(null); return; }
    const [year, month] = date.split('-');
    const t = setTimeout(() => {
      bookingsApi.list({ month: `${year}-${month}`, per_page: 100 }).then(res => {
        let c = 0;
        (res.data.data as any[]).forEach(b => {
          (b.days ?? []).forEach((d: any) => { if (d.date.split('T')[0] === date) c++; });
        });
        setCount(c);
      }).catch(() => setCount(null));
    }, 400);
    return () => clearTimeout(t);
  }, [date]);

  if (!date || count === null) return null;
  if (count === 0) return (
    <p className="text-[10px] text-green-600 mt-1 font-medium">لا توجد حجوزات في هذا اليوم</p>
  );
  return (
    <p className="text-[10px] text-amber-600 mt-1 font-medium flex items-center gap-1">
      <span>⚠</span> هذا اليوم به {count} {count === 1 ? "حجز" : "حجوزات"} مسجلة
    </p>
  );
}

const STEPS_KEYS = ["bookings.wizard.step1","bookings.wizard.step2","bookings.wizard.step3","bookings.wizard.step4"];

function StepIndicator({ current }: { current: number }) {
  const { t } = useLanguage();
  const STEPS = STEPS_KEYS.map(k => t(k));
  return (
    <div className="card mb-5 py-4">
      <div className="flex items-center">
        {STEPS.map((label, i) => (
          <div key={i} className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
            <div className="flex items-center gap-2 shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                i <= current ? "bg-gold text-navy" : "bg-gray-100 text-gray-400"
              }`}>
                {i < current ? <Check size={14} /> : i + 1}
              </div>
              <span className={`text-[13px] font-semibold hidden md:block ${
                i === current ? "text-gold" : i < current ? "text-gold/60" : "text-gray-400"
              }`}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-[2px] mx-2 rounded-full ${i < current ? "bg-gold" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Step1({ clientName, setClientName, clientPhone, setClientPhone, clientPhoneAlt, setClientPhoneAlt,
  address, setAddress, notes, setNotes, days, setDays }: any) {
  const addDay = () => setDays([...days, { date: "" }]);
  const removeDay = (i: number) => setDays(days.filter((_: any, idx: number) => idx !== i));
  const updateDate = (i: number, d: string) =>
    setDays(days.map((day: WizardDay, idx: number) => idx === i ? { date: d } : day));

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="font-bold text-dark mb-4 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center"><Users size={15} className="text-gold" /></span>
          معلومات العميل
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="label">اسم العميل الكامل *</label>
            <input type="text" value={clientName} onChange={(e: any) => setClientName(e.target.value)}
              placeholder="أدخل اسم العميل" className="input-field" />
          </div>
          <div>
            <label className="label">رقم الهاتف الأساسي *</label>
            <div className="relative">
              <Phone size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-text" />
              <input type="text" value={clientPhone} onChange={(e: any) => setClientPhone(e.target.value)}
                placeholder="06 12 34 56 78" className="input-field pr-8" />
            </div>
          </div>
          <div>
            <label className="label">رقم هاتف إضافي (اختياري)</label>
            <div className="relative">
              <Phone size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-text" />
              <input type="text" value={clientPhoneAlt} onChange={(e: any) => setClientPhoneAlt(e.target.value)}
                placeholder="06 98 76 54 32" className="input-field pr-8" />
            </div>
          </div>
        </div>
        <div>
          <label className="label">عنوان الحفل</label>
          <div className="relative">
            <MapPin size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-text" />
            <input type="text" value={address} onChange={(e: any) => setAddress(e.target.value)}
              placeholder="أدخل العنوان بالتفصيل" className="input-field pr-8" />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="mb-4">
          <h3 className="font-bold text-dark flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center"><Calendar size={15} className="text-gold" /></span>
            أيام الحفل
          </h3>
          <p className="text-xs text-gray-text mt-1 mr-9">يمكنك إضافة أكثر من يوم، مع تحديد تاريخ مختلف لكل يوم</p>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {days.map((d: WizardDay, i: number) => (
            <div key={i} className="flex-shrink-0 w-44 border-2 border-border rounded-xl p-3 bg-cream-light">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-dark">اليوم {i + 1}</span>
                <button onClick={() => removeDay(i)} className="w-6 h-6 rounded flex items-center justify-center text-red-400 hover:bg-red-50">
                  <Trash2 size={13} />
                </button>
              </div>
              <label className="text-xs text-gray-text mb-1 block">تاريخ اليوم *</label>
              <input type="date" value={d.date} onChange={(e: any) => updateDate(i, e.target.value)}
                className="input-field text-xs py-2" />
              {d.date && <p className="text-xs text-gold mt-1.5 font-medium">{weekday(d.date)}</p>}
              <DayBookingCount date={d.date} />
            </div>
          ))}
          <button onClick={addDay}
            className="flex-shrink-0 w-44 border-2 border-dashed border-gold/40 rounded-xl flex flex-col items-center justify-center gap-2 p-4 hover:border-gold hover:bg-gold/5 transition-all group">
            <div className="w-10 h-10 rounded-full border-2 border-gold/40 group-hover:border-gold flex items-center justify-center">
              <Plus size={18} className="text-gold" />
            </div>
            <span className="text-sm text-gold font-medium">إضافة يوم جديد</span>
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="font-bold text-dark mb-3 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center"><ReceiptText size={15} className="text-gold" /></span>
          ملاحظات
        </h3>
        <textarea value={notes} onChange={(e: any) => setNotes(e.target.value)} rows={3}
          placeholder="يمكنك إضافة ملاحظات أو تفاصيل إضافية عن الحفل..."
          className="input-field resize-none" />
      </div>

    </div>
  );
}

function ItemsTable({ items, onRemove, onQty, onPrice }: {
  items: WizardItem[];
  onRemove: (type: string, id: number) => void;
  onQty: (type: string, id: number, qty: number) => void;
  onPrice: (type: string, id: number, price: number) => void;
}) {
  const [previewItem, setPreviewItem] = useState<WizardItem | null>(null);
  return (
    <>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-cream">
            <th className="text-right p-2 text-xs font-medium text-gray-text">الصورة</th>
            <th className="text-right p-2 text-xs font-medium text-gray-text">المنتج / الخدمة</th>
            <th className="text-center p-2 text-xs font-medium text-gray-text w-28">الكمية</th>
            <th className="text-left p-2 text-xs font-medium text-gray-text w-24">السعر الأصلي</th>
            <th className="text-left p-2 text-xs font-medium text-gray-text w-24">سعر الحجز</th>
            <th className="text-left p-2 text-xs font-medium text-gray-text w-24">الإجمالي</th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => {
            const src = imgSrc(it.item_image);
            return (
              <tr key={idx} className="border-b border-border/50 hover:bg-gray-50/50">
                <td className="p-2">
                  <div
                    className={`w-10 h-10 rounded-lg bg-gray-100 overflow-hidden transition-all ${src ? "cursor-zoom-in hover:ring-2 hover:ring-gold/50" : ""}`}
                    onClick={() => src && setPreviewItem(it)}
                  >
                    {src
                      ? <img src={src} alt={it.item_name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={14} /></div>}
                  </div>
                </td>
                <td className="p-2">
                  <p className="font-medium text-dark text-sm">{it.item_name}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${it.item_type === "service" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                    {it.item_type === "service" ? "خدمة" : "منتج"}
                  </span>
                </td>
                <td className="p-2">
                  <div className="flex items-center gap-1 justify-center">
                    <button onClick={() => onQty(it.item_type, it.item_id, it.quantity - 1)}
                      className="w-6 h-6 rounded border border-border flex items-center justify-center text-gray-text hover:border-gold text-lg leading-none">—</button>
                    <input
                      type="number" min={1} value={it.quantity}
                      onChange={(e: any) => onQty(it.item_type, it.item_id, Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-12 text-center text-sm font-medium border border-border rounded px-1 py-0.5 focus:outline-none focus:border-gold bg-cream-light"
                    />
                    <button onClick={() => onQty(it.item_type, it.item_id, it.quantity + 1)}
                      className="w-6 h-6 rounded border border-border flex items-center justify-center text-gray-text hover:border-gold text-sm">+</button>
                  </div>
                </td>
                <td className="p-2 text-xs text-gray-text">{fmtC(it.original_price)} د.م</td>
                <td className="p-2">
                  <input type="number" value={it.unit_price} min={0}
                    onChange={(e: any) => onPrice(it.item_type, it.item_id, parseFloat(e.target.value) || 0)}
                    className="w-20 border border-border rounded px-2 py-1 text-xs text-center focus:outline-none focus:border-gold" />
                </td>
                <td className="p-2 text-xs font-bold text-gold">{fmtC(it.quantity * it.unit_price)} د.م</td>
                <td className="p-2">
                  <button onClick={() => onRemove(it.item_type, it.item_id)} className="text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>

    {previewItem && imgSrc(previewItem.item_image) && (
      <ImagePreviewModal
        isOpen
        onClose={() => setPreviewItem(null)}
        image={imgSrc(previewItem.item_image)!}
        name={previewItem.item_name}
        price={previewItem.unit_price}
      />
    )}
    </>
  );
}

function Step2({ days, items, setItems }: { days: WizardDay[]; items: WizardItem[]; setItems: (v: WizardItem[]) => void }) {
  const { t } = useLanguage();
  const [browsing, setBrowsing] = useState<"product" | "service">("product");
  const [svcCats, setSvcCats] = useState<ServiceCategory[]>([]);
  const [prdCats, setPrdCats] = useState<ProductCategory[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [catFilter, setCatFilter] = useState<number | "">("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeDay, setActiveDay] = useState<number | "all">(days.length > 0 ? 0 : "all");
  const [previewCard, setPreviewCard] = useState<{name:string;image:string;price:number;description?:string}|null>(null);

  useEffect(() => {
    servicesApi.categories().then((r: any) => setSvcCats(r.data));
    productsApi.categories().then((r: any) => setPrdCats(r.data));
  }, []);

  useEffect(() => { setCatFilter(""); setSearch(""); setSelected(new Set()); }, [browsing]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (browsing === "product") {
        productsApi.list({ category_id: catFilter || undefined, search: search || undefined, per_page: 50 }).then((r: any) => setProducts(r.data.data));
      } else {
        servicesApi.list({ category_id: catFilter || undefined, search: search || undefined, per_page: 50 }).then((r: any) => setServices(r.data.data));
      }
    }, 300);
    return () => clearTimeout(t);
  }, [browsing, search, catFilter]);

  const toggleCard = (key: string) =>
    setSelected(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });

  const addSelected = () => {
    if (activeDay === "all") return;
    const newItems: WizardItem[] = [];
    selected.forEach(key => {
      const [type, idStr] = key.split("_");
      const id = parseInt(idStr);
      if (type === "product") {
        const p = products.find(x => x.id === id);
        if (p && !items.find(it => it.day_index === activeDay && it.item_type === "product" && it.item_id === id))
          newItems.push({ day_index: activeDay as number, item_type: "product", item_id: id, item_name: p.name, item_image: p.image, quantity: 1, unit_price: parseFloat(p.price), original_price: parseFloat(p.price) });
      } else {
        const s = services.find(x => x.id === id);
        if (s && !items.find(it => it.day_index === activeDay && it.item_type === "service" && it.item_id === id))
          newItems.push({ day_index: activeDay as number, item_type: "service", item_id: id, item_name: s.name, item_image: s.image, quantity: 1, unit_price: parseFloat(s.price), original_price: parseFloat(s.price) });
      }
    });
    setItems([...items, ...newItems]);
    setSelected(new Set());
  };

  const quickAdd = (type: "product" | "service", id: number, name: string, image: string | null, price: number) => {
    if (activeDay === "all") return;
    if (!items.find(it => it.day_index === activeDay && it.item_type === type && it.item_id === id))
      setItems([...items, { day_index: activeDay as number, item_type: type, item_id: id, item_name: name, item_image: image, quantity: 1, unit_price: price, original_price: price }]);
  };

  const removeItem  = (dayIdx: number | null, type: string, id: number) => setItems(items.filter(it => !(it.day_index === dayIdx && it.item_type === type && it.item_id === id)));
  const updateQty   = (dayIdx: number | null, type: string, id: number, qty: number) => setItems(items.map(it => it.day_index === dayIdx && it.item_type === type && it.item_id === id ? { ...it, quantity: Math.max(1, qty) } : it));
  const updatePrice = (dayIdx: number | null, type: string, id: number, price: number) => setItems(items.map(it => it.day_index === dayIdx && it.item_type === type && it.item_id === id ? { ...it, unit_price: price } : it));

  const dayItems  = (dayIdx: number | null) => items.filter(it => it.day_index === dayIdx);
  const dayTotal  = (dayIdx: number | null) => dayItems(dayIdx).reduce((s, it) => s + it.quantity * it.unit_price, 0);
  const grandTotal = items.reduce((s, it) => s + it.quantity * it.unit_price, 0);

  const cats  = browsing === "product" ? prdCats : svcCats;
  const cards = (browsing === "product" ? products : services).map(x => ({
    id: x.id, name: x.name, image: x.image, price: parseFloat(x.price),
    stock: browsing === "product" ? (x as Product).stock : null,
    description: (x as any).description as string | null,
  }));

  return (
    <>
    <div className="flex gap-4 min-h-[620px]">
      <div className="flex-1 min-w-0">
        <div className="card h-full flex flex-col">
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 shrink-0">
            <button onClick={() => setActiveDay("all")}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeDay === "all" ? "bg-gold text-navy" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
              جميع الأيام
            </button>
            {days.map((d, i) => (
              <button key={i} onClick={() => setActiveDay(i)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeDay === i ? "bg-gold text-navy" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                اليوم {i + 1}{d.date ? ` — ${monthDay(d.date)}` : ""}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {activeDay === "all" ? (
              <div className="space-y-5">
                {days.map((d, dayIdx) => {
                  const dItems = dayItems(dayIdx);
                  return (
                    <div key={dayIdx}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${dayClr(dayIdx).dot}`} />
                        <span className="text-sm font-bold text-dark">اليوم {dayIdx + 1} - {d.date ? fullDate(d.date) : "لم يحدد تاريخ"}</span>
                      </div>
                      {dItems.length === 0
                        ? <div className="text-center py-4 text-gray-text text-sm border border-dashed border-border rounded-lg">لا توجد عناصر</div>
                        : <ItemsTable items={dItems} onRemove={(t, id) => removeItem(dayIdx, t, id)} onQty={(t, id, q) => updateQty(dayIdx, t, id, q)} onPrice={(t, id, p) => updatePrice(dayIdx, t, id, p)} />
                      }
                      <div className="text-left text-sm font-bold text-gold mt-1">{fmtC(dayTotal(dayIdx))} د.م</div>
                    </div>
                  );
                })}
                {items.length > 0 && (
                  <div className="flex justify-between border-t border-border pt-2">
                    <span className="text-sm font-bold text-dark">إجمالي المنتجات والخدمات في جميع الأيام</span>
                    <span className="text-sm font-bold text-gold">{fmtC(grandTotal)} د.م</span>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {days[activeDay as number] && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${dayClr(activeDay as number).dot}`} />
                    <span className="text-sm font-bold text-dark">اليوم {(activeDay as number) + 1} - {days[activeDay as number].date ? fullDate(days[activeDay as number].date) : "لم يحدد تاريخ"}</span>
                  </div>
                )}
                {dayItems(activeDay as number).length === 0
                  ? <div className="text-center py-10 text-gray-text text-sm border border-dashed border-border rounded-lg">اختر منتجات أو خدمات من القائمة وأضفها لهذا اليوم</div>
                  : <ItemsTable items={dayItems(activeDay as number)} onRemove={(t, id) => removeItem(activeDay as number, t, id)} onQty={(t, id, q) => updateQty(activeDay as number, t, id, q)} onPrice={(t, id, p) => updatePrice(activeDay as number, t, id, p)} />
                }
                {dayItems(activeDay as number).length > 0 && (
                  <div className="text-left text-sm font-bold text-gold mt-2">{fmtC(dayTotal(activeDay as number))} د.م</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-[360px] shrink-0">
        <div className="card h-full flex flex-col">
          <h3 className="font-bold text-dark mb-3 text-sm">اختر منتجات أو خدمات لإضافتها للحجز</h3>
          <div className="flex rounded-lg overflow-hidden border border-border mb-3 shrink-0">
            <button onClick={() => setBrowsing("product")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${browsing === "product" ? "bg-navy text-white" : "bg-cream-light text-gray-text hover:bg-gray-100"}`}>
              <Package size={13} /> منتج (بمخزون)
            </button>
            <button onClick={() => setBrowsing("service")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${browsing === "service" ? "bg-navy text-white" : "bg-cream-light text-gray-text hover:bg-gray-100"}`}>
              خدمة (بدون مخزون)
            </button>
          </div>
          <select value={catFilter} onChange={(e: any) => setCatFilter(e.target.value === "" ? "" : parseInt(e.target.value))} className="input-field mb-2 text-sm shrink-0">
            <option value="">الفئة</option>
            {cats.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="relative mb-3 shrink-0">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-text" />
            <input type="text" value={search} onChange={(e: any) => setSearch(e.target.value)}
              placeholder={browsing === "product" ? "ابحث عن منتج..." : "ابحث عن خدمة..."}
              className="input-field pr-8 text-sm" />
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-3 gap-2">
              {cards.map(c => {
                const key = `${browsing}_${c.id}`;
                const isSel = selected.has(key);
                const src = imgSrc(c.image);
                return (
                  <div key={c.id} onClick={() => toggleCard(key)}
                    className={`relative rounded-xl border-2 overflow-hidden cursor-pointer transition-all ${isSel ? "border-gold" : "border-border hover:border-gold/50"}`}>
                    <div className="aspect-square bg-gray-100 relative">
                      {src
                        ? <img src={src} alt={c.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={18} /></div>}
                      {isSel && (
                        <div className="absolute inset-0 bg-gold/20 flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-gold flex items-center justify-center">
                            <Check size={12} className="text-navy" />
                          </div>
                        </div>
                      )}
                    {src && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setPreviewCard({ name: c.name, image: src, price: c.price, description: c.description ?? undefined }); }}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
                        >
                          <ZoomIn size={11} />
                        </button>
                      )}
                    </div>
                    <div className="p-1.5">
                      <p className="text-[11px] font-bold text-dark truncate">{c.name}</p>
                      {c.stock !== null && <p className="text-[9px] text-gray-text">المتوفر: {c.stock}</p>}
                      <p className="text-[11px] text-gold font-bold">{fmtC(c.price)} د.م</p>
                    </div>
                    <button onClick={(e: any) => { e.stopPropagation(); quickAdd(browsing, c.id, c.name, c.image, c.price); }}
                      className="absolute bottom-1 left-1 w-5 h-5 rounded-full bg-gold text-navy flex items-center justify-center hover:bg-gold-light text-xs font-bold">
                      +
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          {selected.size > 0 && (
            <button onClick={addSelected} disabled={activeDay === "all"}
              className="btn-primary mt-3 w-full shrink-0 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
              {activeDay === "all" ? t("bookings.wizard.chooseDayFirst") : `إضافة المحدد (${selected.size})`}
            </button>
          )}
        </div>
      </div>
    </div>

    {previewCard && (
      <ImagePreviewModal
        isOpen
        onClose={() => setPreviewCard(null)}
        image={previewCard.image}
        name={previewCard.name}
        price={previewCard.price}
        description={previewCard.description}
      />
    )}
    </>
  );
}

function DayButtons({ days, dayIndices, onChange }: {
  days: WizardDay[];
  dayIndices: number[];
  onChange: (v: number[]) => void;
}) {
  const toggleDay = (di: number) => {
    if (dayIndices.includes(di)) {
      onChange(dayIndices.filter(x => x !== di));
    } else {
      onChange([...dayIndices, di].sort((a, b) => a - b));
    }
  };
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-xs text-gray-text whitespace-nowrap">أيام:</span>
      <button
        onClick={() => onChange([])}
        className={`px-2 py-0.5 rounded text-xs font-medium border transition-colors ${
          dayIndices.length === 0 ? "bg-gold text-navy border-gold" : "border-border text-gray-500 hover:border-gold/60"
        }`}
      >
        كل
      </button>
      {days.map((_, di) => (
        <button
          key={di}
          onClick={() => toggleDay(di)}
          className={`w-7 h-7 rounded text-xs font-bold border transition-colors ${
            dayIndices.includes(di)
              ? `${dayClr(di).badge} border-transparent`
              : "border-border text-gray-500 hover:border-gold/60"
          }`}
        >
          {di + 1}
        </button>
      ))}
    </div>
  );
}

function Step3({ days, items, workers, setWorkers, expenses, setExpenses }: {
  days: WizardDay[]; items: WizardItem[];
  workers: WizardWorker[]; setWorkers: (v: WizardWorker[]) => void;
  expenses: WizardExpense[]; setExpenses: (v: WizardExpense[]) => void;
}) {
  const [allWorkers, setAllWorkers] = useState<Worker[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  useEffect(() => { workersApi.list({ per_page: 200 }).then((r: any) => setAllWorkers(r.data.data)); }, []);

  const addWorker = (w: Worker) => {
    if (!workers.find(x => x.worker_id === w.id))
      setWorkers([...workers, { worker_id: w.id, worker_name: w.name, worker_image: w.image, cost: 0, day_indices: [], task: "" }]);
    setShowPanel(false);
  };
  const removeWorker = (i: number) => setWorkers(workers.filter((_, idx) => idx !== i));
  const updateWorker = (i: number, field: string, val: any) =>
    setWorkers(workers.map((w, idx) => idx === i ? { ...w, [field]: val } : w));

  const addExpense    = () => setExpenses([...expenses, { name: "", quantity: 1, unit_price: 0, day_index: null }]);
  const removeExpense = (i: number) => setExpenses(expenses.filter((_, idx) => idx !== i));
  const updateExpense = (i: number, field: string, val: any) =>
    setExpenses(expenses.map((e, idx) => idx === i ? { ...e, [field]: val } : e));

  const revenue = items.reduce((s, it) => s + it.quantity * it.unit_price, 0);
  const wCost   = workers.reduce((s, w) => s + w.cost, 0);
  const eCost   = expenses.reduce((s, e) => s + e.quantity * e.unit_price, 0);
  const profit  = revenue - wCost - eCost;

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-2">
            <span className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center mt-0.5"><Users size={15} className="text-gold" /></span>
            <div>
              <h3 className="font-bold text-dark text-sm">إضافة العمال</h3>
              <p className="text-xs text-gray-text">يمكنك إضافة العمال الذين سيعملون في هذا الحفل</p>
            </div>
          </div>
          <button onClick={() => setShowPanel(!showPanel)} className="btn-secondary text-sm py-1.5 px-3">
            <Plus size={14} /> إضافة عامل
          </button>
        </div>
        {showPanel && (
          <div className="mb-4 p-3 bg-cream rounded-xl border border-border">
            <p className="text-xs font-medium text-gray-text mb-2">اختر عاملاً</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {allWorkers.map(w => (
                <button key={w.id} onClick={() => addWorker(w)}
                  className="flex items-center gap-2 p-2 rounded-lg border border-border bg-cream-light hover:border-gold text-right transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0">
                    {w.image
                      ? <img src={imgSrc(w.image) ?? ""} alt={w.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-gray-400"><Users size={12} /></div>}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-dark truncate">{w.name}</p>
                    {w.role && <p className="text-[10px] text-gray-text truncate">{w.role}</p>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        {workers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-cream">
                  <th className="text-right p-2 text-xs font-medium text-gray-text">العامل</th>
                  <th className="text-right p-2 text-xs font-medium text-gray-text">أيام العمل</th>
                  <th className="text-right p-2 text-xs font-medium text-gray-text">المهمة</th>
                  <th className="text-left p-2 text-xs font-medium text-gray-text">سعر العامل</th>
                  <th className="w-12" />
                </tr>
              </thead>
              <tbody>
                {workers.map((w, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0">
                          {w.worker_image
                            ? <img src={imgSrc(w.worker_image) ?? ""} alt={w.worker_name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-gray-400"><Users size={12} /></div>}
                        </div>
                        <span className="text-sm font-medium text-dark">{w.worker_name}</span>
                      </div>
                    </td>
                    <td className="p-2">
                      <DayButtons days={days} dayIndices={w.day_indices} onChange={(v) => updateWorker(i, "day_indices", v)} />
                    </td>
                    <td className="p-2">
                      <input type="text" value={w.task} placeholder="وصف المهمة..."
                        onChange={(e: any) => updateWorker(i, "task", e.target.value)}
                        className="border border-border rounded px-2 py-1 text-xs w-full focus:outline-none focus:border-gold bg-cream-light" />
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-1">
                        <input type="number" value={w.cost} min={0}
                          onChange={(e: any) => updateWorker(i, "cost", parseFloat(e.target.value) || 0)}
                          className="w-24 border border-border rounded px-2 py-1 text-xs text-center focus:outline-none focus:border-gold bg-cream-light" />
                        <span className="text-xs text-gray-text">د.م</span>
                      </div>
                    </td>
                    <td className="p-2">
                      <button onClick={() => removeWorker(i)} className="text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-text text-sm py-6">لم يتم إضافة عمال بعد</p>
        )}
      </div>

      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-2">
            <span className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center mt-0.5"><ReceiptText size={15} className="text-gold" /></span>
            <div>
              <h3 className="font-bold text-dark text-sm">مصاريف الحفل</h3>
              <p className="text-xs text-gray-text">أضف جميع المصاريف الإضافية لهذا الحفل</p>
            </div>
          </div>
          <button onClick={addExpense} className="btn-secondary text-sm py-1.5 px-3">
            <Plus size={14} /> إضافة مصروف
          </button>
        </div>
        {expenses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-cream">
                  <th className="text-right p-2 text-xs font-medium text-gray-text">اسم المصروف</th>
                  <th className="text-center p-2 text-xs font-medium text-gray-text w-24">الكمية</th>
                  <th className="text-left p-2 text-xs font-medium text-gray-text w-32">سعر الوحدة</th>
                  <th className="text-left p-2 text-xs font-medium text-gray-text w-28">الإجمالي</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {expenses.map((e, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="p-2">
                      <input type="text" value={e.name} placeholder="اسم المصروف"
                        onChange={(ev: any) => updateExpense(i, "name", ev.target.value)}
                        className="border border-border rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:border-gold bg-cream-light" />
                    </td>
                    <td className="p-2">
                      <input type="number" value={e.quantity} min={1}
                        onChange={(ev: any) => updateExpense(i, "quantity", parseInt(ev.target.value) || 1)}
                        className="w-16 border border-border rounded px-2 py-1.5 text-sm text-center focus:outline-none focus:border-gold bg-cream-light" />
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-1">
                        <input type="number" value={e.unit_price} min={0}
                          onChange={(ev: any) => updateExpense(i, "unit_price", parseFloat(ev.target.value) || 0)}
                          className="w-24 border border-border rounded px-2 py-1.5 text-sm text-center focus:outline-none focus:border-gold bg-cream-light" />
                        <span className="text-xs text-gray-text">د.م</span>
                      </div>
                    </td>
                    <td className="p-2 text-sm font-bold text-gold">{fmtC(e.quantity * e.unit_price)} د.م</td>
                    <td className="p-2">
                      <button onClick={() => removeExpense(i)} className="text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3} className="pt-2 pb-1 text-sm font-bold text-dark text-left px-2">إجمالي المصاريف</td>
                  <td colSpan={2} className="pt-2 pb-1 px-2 text-sm font-bold text-gold">{fmtC(eCost)} د.م</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-text text-sm py-6">لا توجد مصاريف إضافية</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl p-4 text-center bg-emerald-600 text-white">
          <p className="text-xs text-emerald-100 mb-1">إجمالي الإيرادات</p>
          <p className="text-2xl font-bold">{fmtC(revenue)}</p>
          <p className="text-xs text-emerald-200 mt-0.5">د.م — منتجات + خدمات</p>
        </div>
        <div className="rounded-xl p-4 text-center bg-red-500 text-white">
          <p className="text-xs text-red-100 mb-1">إجمالي التكاليف</p>
          <p className="text-2xl font-bold">{fmtC(wCost + eCost)}</p>
          <p className="text-xs text-red-200 mt-0.5">د.م — عمال + مصاريف</p>
        </div>
        <div className={`rounded-xl p-4 text-center text-white ${profit >= 0 ? "bg-gold" : "bg-gray-600"}`}>
          <p className={`text-xs mb-1 ${profit >= 0 ? "text-amber-100" : "text-gray-300"}`}>صافي الربح</p>
          <p className="text-2xl font-bold text-navy">{fmtC(profit)}</p>
          <p className={`text-xs mt-0.5 ${profit >= 0 ? "text-amber-800" : "text-gray-400"}`}>د.م — إيرادات - تكاليف</p>
        </div>
      </div>
    </div>
  );
}

function Step4({ clientName, clientPhone, clientPhoneAlt, address, deposit, setDeposit, days, items, workers, expenses }: {
  clientName: string; clientPhone: string; clientPhoneAlt: string; address: string;
  deposit: number; setDeposit: (v: number) => void;
  days: WizardDay[]; items: WizardItem[]; workers: WizardWorker[]; expenses: WizardExpense[];
}) {
  const [activeTab, setActiveTab] = useState<number | "all">("all");
  const [previewStep4, setPreviewStep4] = useState<{image:string;name:string;price:number}|null>(null);
  const revenue  = items.reduce((s, it) => s + it.quantity * it.unit_price, 0);
  const pRevenue = items.filter(it => it.item_type === "product").reduce((s, it) => s + it.quantity * it.unit_price, 0);
  const sRevenue = items.filter(it => it.item_type === "service").reduce((s, it) => s + it.quantity * it.unit_price, 0);
  const wCost    = workers.reduce((s, w) => s + w.cost, 0);
  const eCost    = expenses.reduce((s, e) => s + e.quantity * e.unit_price, 0);
  const profit   = revenue - wCost - eCost;
  const remaining = revenue - deposit;
  const dayItems = (dayIdx: number) => items.filter(it => it.day_index === dayIdx);

  return (
    <>
    <div className="space-y-4">
      <div className="card">
        <h3 className="font-bold text-dark mb-1">مراجعة تفاصيل الحجز</h3>
        <p className="text-xs text-gray-text mb-4">يرجى مراجعة جميع المعلومات قبل تأكيد الحجز</p>
        <div className="bg-cream rounded-xl p-4 mb-4">
          <h4 className="text-xs font-bold text-gray-text mb-3 flex items-center gap-1"><Users size={12} /> معلومات العميل</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div><p className="text-[10px] text-gray-text">اسم العميل</p><p className="text-sm font-bold text-dark">{clientName || "—"}</p></div>
            <div><p className="text-[10px] text-gray-text">رقم الهاتف الأساسي</p><p className="text-sm font-bold text-dark">{clientPhone || "—"}</p></div>
            <div><p className="text-[10px] text-gray-text">رقم الهاتف الإضافي</p><p className="text-sm font-bold text-dark">{clientPhoneAlt || "—"}</p></div>
            <div><p className="text-[10px] text-gray-text">عنوان الحفل</p><p className="text-sm font-bold text-dark">{address || "—"}</p></div>
            <div>
              <p className="text-[10px] text-gray-text mb-1">التسبيق المدفوع (د.م)</p>
              <input
                type="number" min="0" value={deposit}
                onChange={(e: any) => setDeposit(parseFloat(e.target.value) || 0)}
                className="input-field py-1.5 text-sm font-bold text-emerald-600"
              />
            </div>
          </div>
        </div>
        <div className="mb-4">
          <h4 className="text-xs font-bold text-gray-text mb-3 flex items-center gap-1"><Calendar size={12} /> أيام الحفل</h4>
          <div className="flex gap-3 flex-wrap">
            {days.map((d, i) => (
              <div key={i} className={`rounded-xl border-2 p-3 text-center min-w-[100px] ${dayClr(i).badge}`}>
                <p className="text-xs font-bold">اليوم {i + 1}</p>
                <p className="text-[10px]">{d.date ? weekday(d.date) : "—"}</p>
                <p className="text-xs font-medium mt-0.5">{d.date ? monthDay(d.date) : "—"}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h4 className="font-bold text-dark text-sm mb-3 flex items-center gap-1"><Package size={14} /> المنتجات والخدمات</h4>
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          <button onClick={() => setActiveTab("all")}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTab === "all" ? "bg-gold text-navy" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
            جميع الأيام
          </button>
          {days.map((d, i) => (
            <button key={i} onClick={() => setActiveTab(i)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTab === i ? "bg-gold text-navy" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
              اليوم {i + 1}{d.date ? ` (${monthDay(d.date)})` : ""}
            </button>
          ))}
        </div>
        <div className="space-y-4">
          {(activeTab === "all" ? days.map((_, i) => i) : [activeTab as number]).map(dayIdx => {
            const dItems = dayItems(dayIdx);
            if (dItems.length === 0) return null;
            const dTotal = dItems.reduce((s, it) => s + it.quantity * it.unit_price, 0);
            return (
              <div key={dayIdx}>
                {activeTab === "all" && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${dayClr(dayIdx).dot}`} />
                    <span className="text-sm font-bold text-dark">اليوم {dayIdx + 1} - {days[dayIdx]?.date ? fullDate(days[dayIdx].date) : ""}</span>
                  </div>
                )}
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-cream">
                      <th className="text-right p-2 text-xs font-medium text-gray-text">الصورة</th>
                      <th className="text-right p-2 text-xs font-medium text-gray-text">المنتج / الخدمة</th>
                      <th className="text-center p-2 text-xs font-medium text-gray-text w-16">الكمية</th>
                      <th className="text-left p-2 text-xs font-medium text-gray-text w-24">السعر الأصلي</th>
                      <th className="text-left p-2 text-xs font-medium text-gray-text w-24">سعر الحجز</th>
                      <th className="text-left p-2 text-xs font-medium text-gray-text w-24">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dItems.map((it, idx) => (
                      <tr key={idx} className="border-b border-border/50">
                        <td className="p-2">
                          <div
                            className={`w-10 h-10 rounded-lg bg-gray-100 overflow-hidden transition-all ${imgSrc(it.item_image) ? "cursor-zoom-in hover:ring-2 hover:ring-gold/50" : ""}`}
                            onClick={() => { const s = imgSrc(it.item_image); if (s) setPreviewStep4({ image: s, name: it.item_name, price: it.unit_price }); }}
                          >
                            {imgSrc(it.item_image)
                              ? <img src={imgSrc(it.item_image)!} alt={it.item_name} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={14} /></div>}
                          </div>
                        </td>
                        <td className="p-2">
                          <p className="text-sm font-medium text-dark">{it.item_name}</p>
                          <span className={`text-[10px] px-1.5 rounded ${it.item_type === "service" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                            {it.item_type === "service" ? "خدمة" : "منتج"}
                          </span>
                        </td>
                        <td className="p-2 text-center text-sm">{it.quantity}</td>
                        <td className="p-2 text-sm text-gray-text">{fmtC(it.original_price)} د.م</td>
                        <td className="p-2 text-sm">{fmtC(it.unit_price)} د.م</td>
                        <td className="p-2 text-sm font-bold text-gold">{fmtC(it.quantity * it.unit_price)} د.م</td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={5} className="p-2 text-sm font-bold text-dark text-left">إجمالي اليوم</td>
                      <td className="p-2 text-sm font-bold text-gold">{fmtC(dTotal)} د.م</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
        {items.length > 0 && (
          <div className="flex justify-between items-center mt-3 bg-gold/5 px-3 py-2 rounded-lg border border-gold/20">
            <span className="text-sm font-bold text-dark">إجمالي المنتجات والخدمات</span>
            <span className="text-base font-bold text-gold">{fmtC(revenue)} د.م</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {workers.length > 0 && (
          <div className="card">
            <h4 className="font-bold text-dark text-sm mb-3 flex items-center gap-1"><Users size={14} /> العمال</h4>
            <table className="w-full text-xs">
              <thead><tr className="border-b border-border">
                <th className="text-right pb-1.5 font-medium text-gray-text">العامل</th>
                <th className="text-right pb-1.5 font-medium text-gray-text">الأيام</th>
                <th className="text-left pb-1.5 font-medium text-gray-text">سعر العامل</th>
              </tr></thead>
              <tbody>
                {workers.map((w, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-1.5 font-medium text-dark">{w.worker_name}</td>
                    <td className="py-1.5">
                      {w.day_indices.length === 0
                        ? <span className="text-[10px] text-gray-text">كل الأيام</span>
                        : <div className="flex flex-wrap gap-1">
                            {w.day_indices.map((di: number) => (
                              <span key={di} className={`text-[10px] px-1.5 py-0.5 rounded-full border ${dayClr(di).badge}`}>{di + 1}</span>
                            ))}
                          </div>}
                    </td>
                    <td className="py-1.5 font-bold text-gold">{fmtC(w.cost)} د.م</td>
                  </tr>
                ))}
                <tr className="border-t border-border">
                  <td colSpan={2} className="pt-1.5 font-bold text-dark text-left">إجمالي العمال</td>
                  <td className="pt-1.5 font-bold text-gold">{fmtC(wCost)} د.م</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        {expenses.length > 0 && (
          <div className="card">
            <h4 className="font-bold text-dark text-sm mb-3 flex items-center gap-1"><ReceiptText size={14} /> مصاريف الحفل</h4>
            <table className="w-full text-xs">
              <thead><tr className="border-b border-border">
                <th className="text-right pb-1.5 font-medium text-gray-text">المصروف</th>
                <th className="text-center pb-1.5 font-medium text-gray-text">الكمية</th>
                <th className="text-left pb-1.5 font-medium text-gray-text">الإجمالي</th>
              </tr></thead>
              <tbody>
                {expenses.map((e, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-1.5 font-medium text-dark">{e.name || "—"}</td>
                    <td className="py-1.5 text-center text-gray-text">{e.quantity}</td>
                    <td className="py-1.5 font-bold text-gold">{fmtC(e.quantity * e.unit_price)} د.م</td>
                  </tr>
                ))}
                <tr className="border-t border-border">
                  <td colSpan={2} className="pt-1.5 font-bold text-dark text-left">إجمالي المصاريف</td>
                  <td className="pt-1.5 font-bold text-gold">{fmtC(eCost)} د.م</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        <div className="card">
          <h4 className="font-bold text-dark text-sm mb-3 flex items-center gap-1"><ReceiptText size={14} /> الملخص المالي</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-text">إجمالي المنتجات</span><span className="font-medium text-emerald-700">{fmtC(pRevenue)} د.م</span></div>
            <div className="flex justify-between"><span className="text-gray-text">إجمالي الخدمات</span><span className="font-medium text-emerald-700">{fmtC(sRevenue)} د.م</span></div>
            <div className="flex justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1.5">
              <span className="font-bold text-dark">إجمالي الإيرادات</span>
              <span className="font-bold text-emerald-600">{fmtC(revenue)} د.م</span>
            </div>
            <div className="flex justify-between mt-1"><span className="text-gray-text">التسبيق المدفوع</span><span className="font-medium text-blue-600">{fmtC(deposit)} د.م</span></div>
            <div className="flex justify-between"><span className="text-gray-text">المتبقي للتحصيل</span><span className="font-medium text-orange-500">{fmtC(remaining)} د.م</span></div>
            <div className="flex justify-between border-t border-border pt-1"><span className="text-gray-text">إجمالي العمال</span><span className="font-medium text-red-500">{fmtC(wCost)} د.م</span></div>
            <div className="flex justify-between"><span className="text-gray-text">إجمالي المصاريف</span><span className="font-medium text-red-500">{fmtC(eCost)} د.م</span></div>
            <div className={`mt-2 p-4 rounded-xl text-center ${profit >= 0 ? "bg-gold text-navy" : "bg-red-500 text-white"}`}>
              <p className="text-xs mb-1 opacity-70">صافي الربح</p>
              <p className="text-2xl font-bold">{fmtC(profit)}</p>
              <p className="text-xs mt-0.5 opacity-70">د.م</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    {previewStep4 && (
      <ImagePreviewModal
        isOpen
        onClose={() => setPreviewStep4(null)}
        image={previewStep4.image}
        name={previewStep4.name}
        price={previewStep4.price}
      />
    )}
    </>
  );
}

function BookingWizard() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editIdStr = searchParams.get("edit");
  const editId = editIdStr ? parseInt(editIdStr) : null;

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadingEdit, setLoadingEdit] = useState(!!editId);

  const [clientName,     setClientName]     = useState("");
  const [clientPhone,    setClientPhone]    = useState("");
  const [clientPhoneAlt, setClientPhoneAlt] = useState("");
  const [address,        setAddress]        = useState("");
  const [notes,          setNotes]          = useState("");
  const [deposit,        setDeposit]        = useState(0);
  const [days,           setDays]           = useState<WizardDay[]>([]);
  const [items,          setItems]          = useState<WizardItem[]>([]);
  const [workers,        setWorkers]        = useState<WizardWorker[]>([]);
  const [expenses,       setExpenses]       = useState<WizardExpense[]>([]);

  useEffect(() => {
    if (!editId) return;
    bookingsApi.get(editId).then(res => {
      const b: Booking = res.data;
      setClientName(b.client_name);
      setClientPhone(b.client_phone);
      setClientPhoneAlt(b.client_phone_alt ?? "");
      setAddress(b.address ?? "");
      setNotes(b.notes ?? "");
      setDeposit(parseFloat(b.deposit ?? "0"));

      const wDays: WizardDay[] = (b.days ?? []).map(d => ({ date: d.date.split("T")[0] }));
      setDays(wDays);

      const dayIdToIndex = new Map<number, number>();
      (b.days ?? []).forEach((d, i) => dayIdToIndex.set(d.id, i));

      setItems((b.items ?? []).map(it => ({
        day_index: it.booking_day_id !== null ? (dayIdToIndex.get(it.booking_day_id) ?? null) : null,
        item_type: it.item_type,
        item_id: it.item_id,
        item_name: it.item_name,
        item_image: null,
        quantity: it.quantity,
        unit_price: parseFloat(it.unit_price),
        original_price: parseFloat(it.unit_price),
      })));

      setWorkers((b.workers ?? []).map(w => ({
        worker_id: w.worker_id,
        worker_name: w.worker_name,
        worker_image: null,
        cost: parseFloat(w.cost),
        day_indices: w.booking_day_id !== null ? [dayIdToIndex.get(w.booking_day_id) ?? 0] : [],
        task: "",
      })));

      setExpenses((b.expenses ?? []).map(e => ({
        name: e.name,
        quantity: e.quantity,
        unit_price: parseFloat(e.unit_price),
        day_index: e.booking_day_id !== null ? (dayIdToIndex.get(e.booking_day_id) ?? null) : null,
      })));
    }).catch(() => {}).finally(() => setLoadingEdit(false));
  }, [editId]);

  const canNext = () => {
    if (step === 0) return !!(clientName.trim() && clientPhone.trim() && days.length > 0 && days.every(d => d.date));
    if (step === 1) return days.every((_, i) => items.some(it => it.day_index === i));
    return true;
  };

  const buildPayload = () => ({
    client_name: clientName, client_phone: clientPhone,
    client_phone_alt: clientPhoneAlt || null, address: address || null,
    notes: notes || null, deposit,
    days: days.map(d => d.date),
    items: items.map(it => ({ day_index: it.day_index, item_type: it.item_type, item_id: it.item_id, item_name: it.item_name, quantity: it.quantity, unit_price: it.unit_price })),
    workers: workers.map(w => ({
      worker_id: w.worker_id, worker_name: w.worker_name, cost: w.cost, item_index: null,
      day_index: w.day_indices.length === 1 ? w.day_indices[0] : null,
    })),
    expenses: expenses.map(e => ({ name: e.name, quantity: e.quantity, unit_price: e.unit_price, day_index: e.day_index })),
  });

  const submit = async (shouldConfirm: boolean) => {
    setSaving(true); setError("");
    try {
      let bookingId: number;
      if (editId) {
        const res = await bookingsApi.fullUpdate(editId, buildPayload());
        bookingId = res.data.id;
      } else {
        const res = await bookingsApi.create(buildPayload());
        bookingId = res.data.id;
        if (shouldConfirm) await bookingsApi.confirm(bookingId);
      }
      router.push(`/bookings/${bookingId}`);
    } catch (err: any) {
      const errs = err?.response?.data?.errors;
      setError(errs ? Object.values(errs as Record<string, string[]>).flat().join(" — ") : "حدث خطأ، حاول مجدداً");
    } finally {
      setSaving(false);
    }
  };

  if (loadingEdit) {
    return (
      <div>
        <Topbar title={t("bookings.wizard.step4")} breadcrumb={[{ label: "الرئيسية" }, { label: "الحجوزات" }, { label: "تعديل" }]} />
        <div className="flex items-center justify-center py-32 text-gray-400">جاري تحميل بيانات الحجز...</div>
      </div>
    );
  }

  const title = editId ? t("bookings.wizard.step4") : t("bookings.newBooking");
  const breadLabel = editId ? "تعديل" : t("bookings.newBooking");

  return (
    <div>
      <Topbar title={title} breadcrumb={[{ label: "الرئيسية" }, { label: "الحجوزات" }, { label: breadLabel }]} />
      <div className="p-3 sm:p-6 max-w-6xl mx-auto">
        <StepIndicator current={step} />
        <div className="mb-6">
          {step === 0 && <Step1 clientName={clientName} setClientName={setClientName} clientPhone={clientPhone} setClientPhone={setClientPhone} clientPhoneAlt={clientPhoneAlt} setClientPhoneAlt={setClientPhoneAlt} address={address} setAddress={setAddress} notes={notes} setNotes={setNotes} days={days} setDays={setDays} />}
          {step === 1 && <Step2 days={days} items={items} setItems={setItems} />}
          {step === 2 && <Step3 days={days} items={items} workers={workers} setWorkers={setWorkers} expenses={expenses} setExpenses={setExpenses} />}
          {step === 3 && <Step4 clientName={clientName} clientPhone={clientPhone} clientPhoneAlt={clientPhoneAlt} address={address} deposit={deposit} setDeposit={setDeposit} days={days} items={items} workers={workers} expenses={expenses} />}
        </div>
        {step === 1 && days.length > 0 && !days.every((_, i) => items.some(it => it.day_index === i)) && (
          <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 flex items-center gap-2">
            <span className="text-base">⚠</span>
            يجب إضافة منتج أو خدمة واحدة على الأقل لكل يوم قبل المتابعة
          </div>
        )}
        {error && <p className="text-sm text-red-500 mb-4 text-center">{error}</p>}
        <div className="flex items-center justify-between">
          <button onClick={() => step === 0 ? router.push("/bookings") : setStep(step - 1)} className="btn-secondary px-5">
            {step === 0 ? t("common.cancel") : t("common.prev")}
          </button>
          <div className="flex gap-3">
            {!editId && (
              <button onClick={() => submit(false)} disabled={saving}
                className="flex items-center gap-2 border border-border bg-cream-light text-gray-text hover:border-gold hover:text-gold px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40">
                <Save size={14} /> حفظ كمسودة
              </button>
            )}
            {step < 3 ? (
              <button onClick={() => setStep(step + 1)} disabled={!canNext()}
                className="btn-primary px-6 disabled:opacity-40 disabled:cursor-not-allowed">
                التالي <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={() => submit(!editId)} disabled={saving}
                className="btn-primary px-8 text-base disabled:opacity-60">
                <CheckCircle size={16} /> {saving ? t("common.saving") : editId ? t("common.saveChanges") : t("bookings.wizard.confirmBooking")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewBookingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-32 text-gray-400">جاري التحميل...</div>}>
      <BookingWizard />
    </Suspense>
  );
}
