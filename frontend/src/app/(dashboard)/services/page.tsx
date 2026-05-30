"use client";

import { useState, useEffect, useCallback } from "react";
import Topbar from "@/components/layout/Topbar";
import { Service, ServiceCategory, PaginatedResponse } from "@/types";
import { servicesApi } from "@/lib/api";
import {
  Plus, Search, Filter, Pencil, Trash2,
  X, Loader2, ChevronLeft, ChevronRight, ImageIcon, Check, Upload,
} from "lucide-react";
import { ImagePreviewModal } from "@/components/ui/ImagePreviewModal";

// ── ألوان الفئات ──────────────────────────────────────────────────────────
const STORAGE_URL = (process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:8000') + '/storage';

const CATEGORY_COLORS: Record<string, string> = {
  "التصوير":  "bg-orange-100 text-orange-700",
  "الديكور":  "bg-purple-100 text-purple-700",
  "الضيافة":  "bg-green-100 text-green-700",
  "الصوتيات": "bg-blue-100 text-blue-700",
  "التأجير":  "bg-gray-100 text-gray-700",
};

function CategoryBadge({ name }: { name: string }) {
  const colors = CATEGORY_COLORS[name] ?? "bg-gold/10 text-gold-light";
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${colors}`}>
      {name}
    </span>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  مكون اختيار الفئة — إضافة + مسح
// ════════════════════════════════════════════════════════════════════════════
interface CategorySelectProps {
  categories: ServiceCategory[];
  value: string;
  onChange: (val: string) => void;
  onCategoryAdded: (cat: ServiceCategory) => void;
  onCategoryDeleted: (id: number) => void;
}

function CategorySelect({
  categories, value, onChange, onCategoryAdded, onCategoryDeleted,
}: CategorySelectProps) {
  const [adding, setAdding] = useState(false);
  const [managing, setManaging] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await servicesApi.createCategory(newName.trim());
      onCategoryAdded(res.data);
      onChange(String(res.data.id));
      setNewName("");
      setAdding(false);
    } catch {
      setError("حدث خطأ، حاول مرة أخرى");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: ServiceCategory) => {
    if (!confirm(`هل أنت متأكد من حذف فئة "${cat.name}"؟`)) return;
    setDeletingId(cat.id);
    setError("");
    try {
      await servicesApi.deleteCategory(cat.id);
      onCategoryDeleted(cat.id);
      if (value === String(cat.id)) onChange("");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message ?? "لا يمكن حذف الفئة");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <label className="label">
        الفئة <span className="text-red-500">*</span>
      </label>

      {/* الـ dropdown + زري الإضافة والمسح */}
      <div className="flex gap-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-field flex-1"
          required
        >
          <option value="">اختر الفئة</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        {/* زر إضافة فئة */}
        <button
          type="button"
          onClick={() => { setAdding(!adding); setManaging(false); setError(""); setNewName(""); }}
          title="إضافة فئة جديدة"
          className={`w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 transition-colors ${
            adding
              ? "bg-gold text-navy border-gold"
              : "border-border text-gray-text hover:border-gold hover:text-gold"
          }`}
        >
          {adding ? <X size={16} /> : <Plus size={16} />}
        </button>

        {/* زر مسح الفئات */}
        <button
          type="button"
          onClick={() => { setManaging(!managing); setAdding(false); setError(""); setNewName(""); }}
          title="مسح فئة"
          className={`w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 transition-colors ${
            managing
              ? "bg-red-50 text-red-500 border-red-300"
              : "border-border text-gray-text hover:border-red-300 hover:text-red-400"
          }`}
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* حقل إدخال اسم الفئة الجديدة */}
      {adding && (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
            placeholder="اسم الفئة الجديدة"
            className="input-field flex-1"
            autoFocus
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={saving || !newName.trim()}
            className="w-10 h-10 rounded-lg bg-gold text-navy flex items-center justify-center flex-shrink-0 disabled:opacity-50 hover:bg-gold-light transition-colors"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={16} />}
          </button>
        </div>
      )}

      {/* قائمة الفئات مع زر مسح كل فئة */}
      {managing && (
        <div className="mt-2 border border-red-200 rounded-xl overflow-hidden">
          {categories.length === 0 ? (
            <p className="text-center text-sm text-gray-text py-3">لا توجد فئات</p>
          ) : (
            categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between px-3 py-2.5 border-b border-border last:border-0 hover:bg-red-50/50 transition-colors"
              >
                <span className="text-sm text-dark">{cat.name}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(cat)}
                  disabled={deletingId === cat.id}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-text hover:text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  {deletingId === cat.id
                    ? <Loader2 size={13} className="animate-spin" />
                    : <Trash2 size={13} />}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  نافذة الإضافة / التعديل
// ════════════════════════════════════════════════════════════════════════════
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  categories: ServiceCategory[];
  setCategories: React.Dispatch<React.SetStateAction<ServiceCategory[]>>;
  editingService: Service | null;
}

function ServiceModal({
  isOpen, onClose, onSave, categories, setCategories, editingService,
}: ServiceModalProps) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editingService) {
      setName(editingService.name);
      setCategoryId(String(editingService.category_id));
      setDescription(editingService.description ?? "");
      setPrice(editingService.price);
      setImagePreview(
        editingService.image
          ? `${STORAGE_URL}/${editingService.image}`
          : null
      );
    } else {
      setName("");
      setCategoryId("");
      setDescription("");
      setPrice("");
      setImagePreview(null);
    }
    setImage(null);
    setError("");
  }, [editingService, isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE) {
      setError("حجم الصورة كبير جداً — الحد الأقصى 5MB");
      e.target.value = "";
      return;
    }
    setError("");
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("category_id", categoryId);
      formData.append("description", description);
      formData.append("price", price);
      if (image) formData.append("image", image);

      if (editingService) {
        await servicesApi.update(editingService.id, formData);
      } else {
        await servicesApi.create(formData);
      }

      onSave();
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errors = axiosErr?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)[0]?.[0];
        setError(firstError ?? "حدث خطأ، حاول مرة أخرى");
      } else {
        setError(axiosErr?.response?.data?.message ?? "حدث خطأ، حاول مرة أخرى");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-white z-10">
          <h3 className="text-lg font-bold text-dark">
            {editingService ? "تعديل الخدمة" : "إضافة خدمة جديدة"}
          </h3>
          <button onClick={onClose} className="text-gray-text hover:text-dark transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {/* اسم الخدمة */}
          <div>
            <label className="label">
              اسم الخدمة <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="أدخل اسم الخدمة"
              className="input-field"
              required
            />
          </div>

          {/* الفئة مع أزرار الإضافة والمسح */}
          <CategorySelect
            categories={categories}
            value={categoryId}
            onChange={setCategoryId}
            onCategoryAdded={(cat) => {
              setCategories((prev) => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name, "ar")));
            }}
            onCategoryDeleted={(id) => {
              setCategories((prev) => prev.filter((c) => c.id !== id));
            }}
          />

          {/* الوصف */}
          <div>
            <label className="label">
              الوصف <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اكتب وصفاً مختصراً عن الخدمة"
              className="input-field h-24 resize-none"
              required
            />
          </div>

          {/* السعر */}
          <div>
            <label className="label">
              السعر <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-text text-sm font-medium">
                د.م
              </span>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="input-field pl-12"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          {/* الصورة */}
          <div>
            <label className="label">
              صورة الخدمة
              <span className="text-gray-text font-normal text-xs mr-1">(PNG, JPG — حتى 5MB)</span>
            </label>
            <label className="block border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-gold transition-colors">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="preview"
                  className="h-32 mx-auto object-cover rounded-lg"
                />
              ) : (
                <>
                  <Upload size={28} className="text-gold mx-auto mb-2" />
                  <p className="text-sm text-gray-text">اسحب صورة أو اضغط للاختيار</p>
                  <p className="text-xs text-gray-text mt-1">PNG, JPG حتى 5MB</p>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 py-2.5 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>جارِ الحفظ...</span>
                </>
              ) : (
                <span>{editingService ? "حفظ التعديلات" : "حفظ الخدمة"}</span>
              )}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  الصفحة الرئيسية
// ════════════════════════════════════════════════════════════════════════════
export default function ServicesPage() {
  const [services, setServices] = useState<PaginatedResponse<Service> | null>(null);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [previewService, setPreviewService] = useState<Service | null>(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await servicesApi.list({
        search: search || undefined,
        category_id: selectedCategory ? Number(selectedCategory) : undefined,
        page,
        per_page: 10,
      });
      setServices(res.data);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, page]);

  useEffect(() => {
    servicesApi.categories().then((res) => setCategories(res.data));
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذه الخدمة؟")) return;
    setDeletingId(id);
    try {
      await servicesApi.delete(id);
      fetchServices();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <Topbar
        title="الخدمات"
        breadcrumb={[{ label: "الرئيسية" }, { label: "الخدمات" }]}
      />

      <div className="p-3 sm:p-6">

        {/* شريط الأدوات */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex gap-3">
            <button
              onClick={() => { setEditingService(null); setModalOpen(true); }}
              className="btn-primary"
            >
              <Plus size={16} />
              <span>خدمة جديدة</span>
            </button>
          </div>
        </div>

        {/* الفلاتر */}
        <div className="card mb-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-text" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="ابحث عن خدمة..."
                className="input-field pr-8"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
              className="input-field w-44"
            >
              <option value="">جميع الفئات</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {(searchInput || selectedCategory) && (
              <button
                onClick={() => { setSearchInput(""); setSelectedCategory(""); setPage(1); }}
                className="flex items-center gap-1.5 text-gray-text hover:text-dark text-sm transition-colors"
              >
                <Filter size={14} />
                <span>إعادة تعيين</span>
              </button>
            )}
          </div>
        </div>

        {/* الجدول */}
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead className="bg-cream border-b border-border">
              <tr>
                <th className="text-right text-sm font-semibold text-dark px-4 py-3">الخدمة</th>
                <th className="text-right text-sm font-semibold text-dark px-4 py-3">الفئة</th>
                <th className="text-right text-sm font-semibold text-dark px-4 py-3">الوصف</th>
                <th className="text-right text-sm font-semibold text-dark px-4 py-3">السعر</th>
                <th className="text-right text-sm font-semibold text-dark px-4 py-3">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-20">
                    <Loader2 size={32} className="animate-spin text-gold mx-auto" />
                  </td>
                </tr>
              ) : services?.data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-20 text-gray-text">
                    لا توجد خدمات
                  </td>
                </tr>
              ) : (
                services?.data.map((service) => (
                  <tr
                    key={service.id}
                    className="border-b border-border last:border-0 hover:bg-cream/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-lg bg-cream border border-border flex items-center justify-center flex-shrink-0 overflow-hidden transition-all ${service.image ? "cursor-zoom-in hover:ring-2 hover:ring-gold/50" : ""}`}
                          onClick={() => service.image && setPreviewService(service)}
                        >
                          {service.image ? (
                            <img
                              src={`${STORAGE_URL}/${service.image}`}
                              alt={service.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon size={20} className="text-gray-text" />
                          )}
                        </div>
                        <span className="font-semibold text-dark text-sm">{service.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <CategoryBadge name={service.category.name} />
                    </td>
                    <td className="px-4 py-3 text-gray-text text-sm max-w-xs">
                      <p className="line-clamp-2">{service.description}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-dark text-sm whitespace-nowrap">
                      {Number(service.price).toLocaleString("ar-MA")} د.م
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditingService(service); setModalOpen(true); }}
                          className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-gray-text hover:border-gold hover:text-gold transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(service.id)}
                          disabled={deletingId === service.id}
                          className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-gray-text hover:border-red-400 hover:text-red-500 transition-colors disabled:opacity-50"
                        >
                          {deletingId === service.id
                            ? <Loader2 size={14} className="animate-spin" />
                            : <Trash2 size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* Pagination */}
        {services && services.last_page > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-text">
              من {(services.current_page - 1) * services.per_page + 1} إلى{" "}
              {Math.min(services.current_page * services.per_page, services.total)} من{" "}
              {services.total} خدمة
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={services.current_page === 1}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-gray-text hover:border-gold hover:text-gold transition-colors disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
              {Array.from({ length: services.last_page }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - services.current_page) <= 2)
                .map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      p === services.current_page
                        ? "bg-gold text-navy"
                        : "border border-border text-gray-text hover:border-gold hover:text-gold"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              <button
                onClick={() => setPage((p) => Math.min(services.last_page, p + 1))}
                disabled={services.current_page === services.last_page}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-gray-text hover:border-gold hover:text-gold transition-colors disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {previewService?.image && (
        <ImagePreviewModal
          isOpen
          onClose={() => setPreviewService(null)}
          image={`${STORAGE_URL}/${previewService.image}`}
          name={previewService.name}
          price={previewService.price}
          description={previewService.description ?? undefined}
        />
      )}

      <ServiceModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingService(null); }}
        onSave={fetchServices}
        categories={categories}
        setCategories={setCategories}
        editingService={editingService}
      />
    </div>
  );
}