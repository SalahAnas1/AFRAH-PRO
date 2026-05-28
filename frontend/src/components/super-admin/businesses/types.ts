// ── أنواع البيانات ──────────────────────────────────────────────────────────

export type BusinessStatus = "active" | "disabled" | "expiring_soon" | "expired";
export type PlanType       = "Basic"  | "Premium"  | "Enterprise";

export interface BusinessActivity {
  id:   number;
  text: string;
  date: string;
}

export interface Business {
  id:           number;
  name:         string;
  owner:        string;
  ownerEmail:   string;
  ownerPhone:   string;
  city:         string;
  address:      string;
  phone:        string;
  email:        string;
  bookings:     number;
  products:     number;
  services:     number;
  workers:      number;
  plan:         PlanType;
  planExpiry:   string;
  status:       BusinessStatus;
  revenue:      number;
  expenses:     number;
  registeredAt: string;
  lastActivity: string;
  activities:   BusinessActivity[];
}

export interface StatsData {
  total:         number;
  active:        number;
  disabled:      number;
  expired:       number;
  totalBookings: number;
  totalRevenue:  number;
}

export interface FiltersState {
  search:   string;
  city:     string;
  status:   string;
  plan:     string;
  dateFrom: string;
}

export interface NewBusinessForm {
  name:          string;
  phone:         string;
  email:         string;
  city:          string;
  address:       string;
  ownerName:     string;
  ownerEmail:    string;
  ownerPhone:    string;
  ownerPassword: string;
  plan:          PlanType;
  planStart:     string;
  planExpiry:    string;
  status:        BusinessStatus;
}

// ── نوع استجابة API (snake_case من Laravel) ───────────────────────────────

export interface ApiBusiness {
  id:            number;
  name:          string;
  phone:         string;
  email:         string;
  city:          string;
  address:       string;
  plan:          string;
  plan_expiry:   string;
  status:        string;
  bookings:      number;
  products:      number;
  services:      number;
  workers:       number;
  registered_at: string;
  owner: {
    id:    number;
    name:  string;
    email: string;
    phone: string;
  } | null;
}

// دالة تحويل استجابة API إلى نوع Business الداخلي
export function fromApi(b: ApiBusiness): Business {
  return {
    id:           b.id,
    name:         b.name,
    phone:        b.phone        ?? "",
    email:        b.email        ?? "",
    city:         b.city         ?? "",
    address:      b.address      ?? "",
    plan:         (b.plan as PlanType) ?? "Basic",
    planExpiry:   b.plan_expiry  ?? "",
    status:       (b.status as BusinessStatus) ?? "active",
    bookings:     b.bookings     ?? 0,
    products:     b.products     ?? 0,
    services:     b.services     ?? 0,
    workers:      b.workers      ?? 0,
    owner:        b.owner?.name  ?? "",
    ownerEmail:   b.owner?.email ?? "",
    ownerPhone:   b.owner?.phone ?? "",
    revenue:      0,
    expenses:     0,
    registeredAt: b.registered_at ?? "",
    lastActivity: "—",
    activities:   [],
  };
}

// ── الإعدادات المرئية ────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<BusinessStatus, { label: string; className: string }> = {
  active:        { label: "نشط",             className: "bg-green-100 text-green-700"   },
  disabled:      { label: "معطل",            className: "bg-gray-100 text-gray-500"     },
  expiring_soon: { label: "سينتهي قريباً",   className: "bg-orange-100 text-orange-600" },
  expired:       { label: "منتهي",           className: "bg-red-100 text-red-600"       },
};

export const PLAN_CONFIG: Record<PlanType, { className: string }> = {
  Basic:      { className: "bg-blue-50 text-blue-600"     },
  Premium:    { className: "bg-amber-50 text-amber-600"   },
  Enterprise: { className: "bg-purple-50 text-purple-600" },
};

// ── قوائم الفلاتر ───────────────────────────────────────────────────────────

export const CITIES  = ["الكل", "بركان", "وجدة", "الناظور", "تطوان", "مراكش", "الرباط", "الدار البيضاء"];
export const PLANS   = ["الكل", "Basic", "Premium", "Enterprise"];
export const STATUSES = [
  { value: "all",           label: "كل الحالات"   },
  { value: "active",        label: "نشط"           },
  { value: "disabled",      label: "معطل"          },
  { value: "expiring_soon", label: "سينتهي قريباً" },
  { value: "expired",       label: "منتهي"         },
];

// ── أداة تنسيق التاريخ ──────────────────────────────────────────────────────

export function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// ── حساب إحصائيات من القائمة ─────────────────────────────────────────────

export function calcStats(list: Business[]): StatsData {
  return {
    total:         list.length,
    active:        list.filter((b) => b.status === "active").length,
    disabled:      list.filter((b) => b.status === "disabled").length,
    expired:       list.filter((b) => b.status === "expired" || b.status === "expiring_soon").length,
    totalBookings: list.reduce((s, b) => s + b.bookings, 0),
    totalRevenue:  list.reduce((s, b) => s + b.revenue,  0),
  };
}

// ── الفلاتر الافتراضية ───────────────────────────────────────────────────────

export const EMPTY_FILTERS: FiltersState = {
  search: "", city: "الكل", status: "all", plan: "الكل", dateFrom: "",
};

export const EMPTY_FORM: NewBusinessForm = {
  name: "", phone: "", email: "", city: "", address: "",
  ownerName: "", ownerEmail: "", ownerPhone: "", ownerPassword: "",
  plan: "Basic", planStart: "", planExpiry: "", status: "active",
};