export interface ServiceCategory {
  id: number; business_id: number; name: string; created_at: string; updated_at: string;
}
export interface Service {
  id: number; business_id: number; category_id: number; name: string;
  description: string | null; price: string; image: string | null;
  category: ServiceCategory; created_at: string; updated_at: string;
}
export interface ProductCategory {
  id: number; business_id: number; name: string; created_at: string; updated_at: string;
}
export interface Product {
  id: number; business_id: number; category_id: number | null; name: string;
  description: string | null; price: string; stock: number; unit: string;
  image: string | null; category: ProductCategory | null; created_at: string; updated_at: string;
}
export interface Worker {
  id: number; business_id: number; name: string; phone: string | null;
  role: string | null; image: string | null; created_at: string; updated_at: string;
}
export interface InvoiceCategory {
  id: number; business_id: number; name: string; created_at: string; updated_at: string;
}
export interface Invoice {
  id: number; business_id: number; category_id: number | null;
  supplier: string; invoice_date: string; total_amount: string;
  status: "paid" | "unpaid"; notes: string | null;
  category: InvoiceCategory | null; created_at: string; updated_at: string;
}
export interface PaginatedResponse<T> {
  data: T[]; current_page: number; last_page: number; per_page: number; total: number;
}

// ─── Bookings ───────────────────────────────────────────────────────────────

export type BookingStatus = "draft" | "confirmed" | "completed" | "cancelled";
export type ItemType = "product" | "service";

export interface BookingDay {
  id: number;
  booking_id: number;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface BookingItem {
  id: number;
  booking_id: number;
  booking_day_id: number | null;
  item_type: ItemType;
  item_id: number;
  item_name: string;
  quantity: number;
  unit_price: string;
  created_at: string;
  updated_at: string;
}

export interface BookingWorker {
  id: number;
  booking_id: number;
  booking_day_id: number | null;
  worker_id: number | null;
  worker_name: string;
  cost: string;
  booking_item_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface BookingExpense {
  id: number;
  booking_id: number;
  booking_day_id: number | null;
  name: string;
  quantity: number;
  unit_price: string;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: number;
  business_id: number;
  client_name: string;
  client_phone: string;
  client_phone_alt: string | null;
  address: string | null;
  status: BookingStatus;
  notes: string | null;
  deposit: string;
  total_revenue?: string;
  days: BookingDay[];
  items: BookingItem[];
  workers: BookingWorker[];
  expenses: BookingExpense[];
  created_at: string;
  updated_at: string;
}

// ─── Wizard step types (used in the 4-step form) ────────────────────────────

export interface WizardDay {
  date: string;
}

export interface WizardItem {
  day_index: number | null;
  item_type: ItemType;
  item_id: number;
  item_name: string;
  quantity: number;
  unit_price: number;
}

export interface WizardWorker {
  worker_id: number | null;
  worker_name: string;
  worker_image: string | null;
  cost: number;
  day_indices: number[];
  item_index: number | null;
}

export interface WizardExpense {
  name: string;
  quantity: number;
  unit_price: number;
  day_index: number | null;
}