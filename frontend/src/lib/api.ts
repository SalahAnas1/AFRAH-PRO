import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api",
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const servicesApi = {
  list: (params?: { search?: string; category_id?: number; page?: number; per_page?: number }) =>
    api.get("/services", { params }),
  create: (data: FormData) =>
    api.post("/services", data, { headers: { "Content-Type": "multipart/form-data" } }),
  update: (id: number, data: FormData) =>
    api.post(`/services/${id}?_method=PUT`, data, { headers: { "Content-Type": "multipart/form-data" } }),
  delete: (id: number) => api.delete(`/services/${id}`),
  categories: () => api.get("/services/categories"),
  createCategory: (name: string) => api.post("/services/categories", { name }),
  deleteCategory: (id: number) => api.delete(`/services/categories/${id}`),
};

export const productsApi = {
  list: (params?: { search?: string; category_id?: number; stock_status?: string; page?: number; per_page?: number }) =>
    api.get("/products", { params }),
  create: (data: FormData) =>
    api.post("/products", data, { headers: { "Content-Type": "multipart/form-data" } }),
  update: (id: number, data: FormData) =>
    api.post(`/products/${id}?_method=PUT`, data, { headers: { "Content-Type": "multipart/form-data" } }),
  delete: (id: number) => api.delete(`/products/${id}`),
  categories: () => api.get("/products/categories"),
  createCategory: (name: string) => api.post("/products/categories", { name }),
  deleteCategory: (id: number) => api.delete(`/products/categories/${id}`),
};

export const workersApi = {
  list: (params?: { search?: string; page?: number; per_page?: number }) =>
    api.get("/workers", { params }),
  create: (data: FormData) =>
    api.post("/workers", data, { headers: { "Content-Type": "multipart/form-data" } }),
  update: (id: number, data: FormData) =>
    api.post(`/workers/${id}?_method=PUT`, data, { headers: { "Content-Type": "multipart/form-data" } }),
  delete: (id: number) => api.delete(`/workers/${id}`),
};

export const invoicesApi = {
  list: (params?: { search?: string; status?: string; category_id?: number; month?: string; page?: number; per_page?: number }) =>
    api.get("/invoices", { params }),
  create: (data: object) => api.post("/invoices", data),
  update: (id: number, data: object) => api.post(`/invoices/${id}?_method=PUT`, data),
  delete: (id: number) => api.delete(`/invoices/${id}`),
  categories: () => api.get("/invoices/categories"),
  createCategory: (name: string) => api.post("/invoices/categories", { name }),
  deleteCategory: (id: number) => api.delete(`/invoices/categories/${id}`),
};

export const bookingsApi = {
  list: (params?: { search?: string; status?: string; month?: string; page?: number; per_page?: number }) =>
    api.get("/bookings", { params }),
  get: (id: number) => api.get(`/bookings/${id}`),
  create: (data: object) => api.post("/bookings", data),
  update: (id: number, data: object) => api.put(`/bookings/${id}`, data),
  fullUpdate: (id: number, data: object) => api.put(`/bookings/${id}/full`, data),
  updateDeposit: (id: number, deposit: number) => api.put(`/bookings/${id}/deposit`, { deposit }),
  delete: (id: number) => api.delete(`/bookings/${id}`),
  confirm: (id: number) => api.post(`/bookings/${id}/confirm`),
  complete: (id: number) => api.post(`/bookings/${id}/complete`),
  cancel: (id: number) => api.post(`/bookings/${id}/cancel`),
  // days
  addDay: (bookingId: number, date: string) => api.post(`/bookings/${bookingId}/days`, { date }),
  deleteDay: (bookingId: number, dayId: number) => api.delete(`/bookings/${bookingId}/days/${dayId}`),
  // items
  addItem: (bookingId: number, data: object) => api.post(`/bookings/${bookingId}/items`, data),
  updateItem: (bookingId: number, itemId: number, data: object) => api.put(`/bookings/${bookingId}/items/${itemId}`, data),
  deleteItem: (bookingId: number, itemId: number) => api.delete(`/bookings/${bookingId}/items/${itemId}`),
  // workers
  addWorker: (bookingId: number, data: object) => api.post(`/bookings/${bookingId}/workers`, data),
  updateWorker: (bookingId: number, workerId: number, data: object) => api.put(`/bookings/${bookingId}/workers/${workerId}`, data),
  deleteWorker: (bookingId: number, workerId: number) => api.delete(`/bookings/${bookingId}/workers/${workerId}`),
  // expenses
  addExpense: (bookingId: number, data: object) => api.post(`/bookings/${bookingId}/expenses`, data),
  updateExpense: (bookingId: number, expenseId: number, data: object) => api.put(`/bookings/${bookingId}/expenses/${expenseId}`, data),
  deleteExpense: (bookingId: number, expenseId: number) => api.delete(`/bookings/${bookingId}/expenses/${expenseId}`),
};

export const reportsApi = {
  daily:    (date: string) =>
    api.get("/reports/daily",    { params: { date } }),
  monthly:  (year: number, month: number) =>
    api.get("/reports/monthly",  { params: { year, month } }),
  annual:   (year: number) =>
    api.get("/reports/annual",   { params: { year } }),
  bookings: (params: { date_from?: string; date_to?: string; status?: string; page?: number }) =>
    api.get("/reports/bookings", { params }),
  products: (params: { date_from?: string; date_to?: string }) =>
    api.get("/reports/products", { params }),
  services: (params: { date_from?: string; date_to?: string }) =>
    api.get("/reports/services", { params }),
  workers:  (params: { date_from?: string; date_to?: string }) =>
    api.get("/reports/workers",  { params }),
};

export const inventoryApi = {
  calendar: (year: number, month: number) =>
    api.get("/inventory/calendar", { params: { year, month } }),
  dayDetail: (date: string) =>
    api.get("/inventory/day", { params: { date } }),
  movements: (params?: { product_id?: number; type?: string; page?: number; per_page?: number }) =>
    api.get("/inventory/movements", { params }),
  addMovement: (data: object) => api.post("/inventory/movements", data),
  alerts: (threshold?: number) =>
    api.get("/inventory/alerts", { params: threshold ? { threshold } : undefined }),
};

export const settingsApi = {
  getBusiness:    () => api.get("/settings/business"),
  updateBusiness: (data: FormData) =>
    api.post("/settings/business", data, { headers: { "Content-Type": "multipart/form-data" } }),
  getAccount:     () => api.get("/settings/account"),
  updateAccount:  (data: object) => api.put("/settings/account", data),
  changePassword: (data: object) => api.put("/settings/password", data),
};

export const dashboardApi = {
  index:    (date: string) => api.get("/dashboard",          { params: { date } }),
  calendar: (year: number, month: number) => api.get("/dashboard/calendar", { params: { year, month } }),
};

export const notificationsApi = {
  list:       (params?: { page?: number }) => api.get("/notifications", { params }),
  unreadCount: ()                          => api.get("/notifications/unread-count"),
  markRead:   (id: number)                 => api.put(`/notifications/${id}/mark-read`),
  markAllRead: ()                          => api.put("/notifications/mark-all-read"),
  delete:     (id: number)                 => api.delete(`/notifications/${id}`),
};

export const advertisementsApi = {
  superAdmin: {
    list:   ()                       => api.get("/super-admin/advertisements"),
    get:    (id: number)             => api.get(`/super-admin/advertisements/${id}`),
    create: (data: FormData)         => api.post("/super-admin/advertisements", data, { headers: { "Content-Type": "multipart/form-data" } }),
    update: (id: number, data: FormData) => api.post(`/super-admin/advertisements/${id}?_method=PUT`, data, { headers: { "Content-Type": "multipart/form-data" } }),
    delete: (id: number)             => api.delete(`/super-admin/advertisements/${id}`),
  },
  active: () => api.get("/advertisements/active"),
};

export const authApi = {
  login: (email: string, password: string) => api.post("/auth/login", { email, password }),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
};

export const superAdminApi = {
  dashboard: {
    statistics: () => api.get("/super-admin/dashboard/statistics"),
  },
  businesses: {
    list:         ()                         => api.get("/super-admin/businesses"),
    create:       (data: object)             => api.post("/super-admin/businesses", data),
    update:       (id: number, data: object) => api.put(`/super-admin/businesses/${id}`, data),
    delete:       (id: number)               => api.delete(`/super-admin/businesses/${id}`),
    toggleStatus: (id: number)               => api.patch(`/super-admin/businesses/${id}/toggle-status`),
  },
  owners: {
    list:          ()                               => api.get("/super-admin/owners"),
    update:        (id: number, data: object)       => api.put(`/super-admin/owners/${id}`, data),
    toggleStatus:  (id: number)                     => api.patch(`/super-admin/owners/${id}/toggle-status`),
    resetPassword: (id: number, password: string)   => api.patch(`/super-admin/owners/${id}/reset-password`, { password }),
    delete:        (id: number)                     => api.delete(`/super-admin/owners/${id}`),
  },
};

export default api;