// ── أنواع البيانات ──────────────────────────────────────────────────────────

export type OwnerStatus = "active" | "disabled";

export interface OwnerBusiness {
  id:   number;
  name: string;
  city: string;
  plan: string;
}

export interface Owner {
  id:        number;
  name:      string;
  email:     string;
  phone:     string;
  status:    OwnerStatus;
  createdAt: string;
  business:  OwnerBusiness | null;
}

export interface ApiOwner {
  id:         number;
  name:       string;
  email:      string;
  phone:      string;
  status:     string;
  created_at: string;
  business: {
    id:   number;
    name: string;
    city: string;
    plan: string;
  } | null;
}

export interface EditOwnerForm {
  name:  string;
  email: string;
  phone: string;
}

export interface StatsData {
  total:    number;
  active:   number;
  disabled: number;
}

export interface FiltersState {
  search: string;
  status: string;
}

// ── تحويل استجابة API ────────────────────────────────────────────────────────

export function fromApi(o: ApiOwner): Owner {
  return {
    id:        o.id,
    name:      o.name,
    email:     o.email,
    phone:     o.phone      ?? "",
    status:    (o.status as OwnerStatus) ?? "active",
    createdAt: o.created_at ?? "",
    business:  o.business   ?? null,
  };
}

// ── حساب الإحصائيات ──────────────────────────────────────────────────────────

export function calcStats(list: Owner[]): StatsData {
  return {
    total:    list.length,
    active:   list.filter((o) => o.status === "active").length,
    disabled: list.filter((o) => o.status === "disabled").length,
  };
}

// ── ألوان الحالة ─────────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<OwnerStatus, { label: string; className: string }> = {
  active:   { label: "نشط",  className: "bg-green-100 text-green-700" },
  disabled: { label: "معطل", className: "bg-gray-100 text-gray-500"   },
};

// ── ألوان الأفاتار ───────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
];

export function avatarColor(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

// ── تنسيق التاريخ ────────────────────────────────────────────────────────────

export function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// ── الفلاتر الافتراضية ───────────────────────────────────────────────────────

export const EMPTY_FILTERS: FiltersState = { search: "", status: "all" };

export const EMPTY_EDIT_FORM: EditOwnerForm = { name: "", email: "", phone: "" };