"use client";

import { useState, useEffect, useCallback } from "react";
import Topbar from "@/components/layout/Topbar";
import { Product, ProductCategory, PaginatedResponse } from "@/types";
import { productsApi } from "@/lib/api";
import {
  Plus, Search, Pencil, Trash2,
  X, Loader2, ChevronLeft, ChevronRight, Package, Check, Upload,
} from "lucide-react";

// ── وحدات القياس ─────────────────────────────────────────────────────────
const UNITS = ["قطعة", "كيلو", "لتر", "متر", "صندوق", "طقم", "زوج"];

// ── بادج المخزون ─────────────────────────────────────────────────────────
function StockBadge({ stock }: { stock: number }) {
  if (stock === 0)
    return <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">نفد المخزون</span>;
  if (stock <= 10)
    return <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">منخفض — {stock}</span>;
  return <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">{stock}</span>;
}

// ── بادج الفئة ────────────────────────────────────────────────────────────
function CategoryBadge({ name }: { name: string }) {
  return (
    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-gold/10 text-dark">
      {name}
    </span>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  مكون اختيار الفئة — إضافة + مسح
// ════════════════════════════════════════════════════════════════════════════
interface CategorySelectProps {
  categories: ProductCategory[];
  value: string;
  onChange: (val: string) => void;
  onCategoryAdded: (cat: ProductCategory) => void;
  onCategoryDeleted: (id: number) => void;
}

function CategorySelect({ categories, value, onChange, onCategoryAdded, onCategoryDeleted }: CategorySelectProps) {
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
      const res = await productsApi.createCategory(newName.trim());
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

  const handleDelete = async (cat: ProductCategory) => {
    if (!confirm(`هل أنت متأكد من حذف فئة "${cat.name}"؟`)) return;
    setDeletingId(cat.id);
    setError("");
    try {
      await productsApi.deleteCategory(cat.id);
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
      <label className="label">الفئة</label>
      <div className="flex gap-2">
        <select value={value} onChange={(e) => onChange(e.target.value)} className="input-field flex-1">
          <option value="">بدون فئة</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => { setAdding(!adding); setManaging(false); setError(""); setNewName(""); }}
          title="إضافة فئة"
          className={`w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 transition-colors ${
            adding ? "bg-gold text-navy border-gold" : "border-border text-gray-text hover:border-gold hover:text-gold"
          }`}
        >
          {adding ? <X size={16} /> : <Plus size={16} />}
        </button>

        <button
          type="button"
          onClick={() => { setManaging(!managing); setAdding(false); setError(""); setNewName(""); }}
          title="مسح فئة"
          className={`w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 transition-colors ${
            managing ? "bg-red-50 text-red-500 border-red-300" : "border-border text-gray-text hover:border-red-300 hover:text-red-400"
          }`}
        >
          <Trash2 size={15} />
        </button>
      </div>

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
            className="w-10 h-10 rounded-lg bg-gold text-navy flex items-center justify-center flex-shrink-0 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={16} />}
          </button>
        </div>
      )}

      {managing && (
        <div className="mt-2 border border-red-200 rounded-xl overflow-hidden">
          {categories.length === 0 ? (
            <p className="text-center text-sm text-gray-text py-3">لا توجد فئات</p>
          ) : (
            categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between px-3 py-2.5 border-b border-border last:border-0 hover:bg-red-50/50 transition-colors">
                <span className="text-sm text-dark">{cat.name}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(cat)}
                  disabled={deletingId === cat.id}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-text hover:text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  {deletingId === cat.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  نافذة الإضافة / التعديل
// ════════════════════════════════════════════════════════════════════════════
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  categories: ProductCategory[];
  setCategories: React.Dispatch<React.SetStateAction<ProductCategory[]>>;
  editingProduct: Product | null;
}

function ProductModal({ isOpen, onClose, onSave, categories, setCategories, editingProduct }: ProductModalProps) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [unit, setUnit] = useState("قطعة");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name);
      setCategoryId(editingProduct.category_id ? String(editingProduct.category_id) : "");
      setDescription(editingProduct.description ?? "");
      setPrice(editingProduct.price);
      setStock(String(editingProduct.stock));
      setUnit(editingProduct.unit);
      setImagePreview(
        editingProduct.image ? `http://localhost:8000/storage/${editingProduct.image}` : null
      );
    } else {
      setName(""); setCategoryId(""); setDescription("");
      setPrice(""); setStock(""); setUnit("قطعة"); setImagePreview(null);
    }
    setImage(null);
    setError("");
  }, [editingProduct, isOpen]);

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
      if (categoryId) formData.append("category_id", categoryId);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("stock", stock);
      formData.append("unit", unit);
      if (image) formData.append("image", image);

      if (editingProduct) {
        await productsApi.update(editingProduct.id, formData);
      } else {
        await productsApi.create(formData);
      }
      onSave();
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errors = axiosErr?.response?.data?.errors;
      if (errors) {
        setError(Object.values(errors)[0]?.[0] ?? "حدث خطأ");
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
            {editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}
          </h3>
          <button onClick={onClose} className="text-gray-text hover:text-dark transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>
          )}

          <div>
            <label className="label">اسم المنتج <span className="text-red-500">*</span></label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="أدخل اسم المنتج" className="input-field" required />
          </div>

          <CategorySelect
            categories={categories}
            value={categoryId}
            onChange={setCategoryId}
            onCategoryAdded={(cat) =>
              setCategories((prev) => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name, "ar")))
            }
            onCategoryDeleted={(id) =>
              setCategories((prev) => prev.filter((c) => c.id !== id))
            }
          />

          <div>
            <label className="label">الوصف</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف مختصر للمنتج (اختياري)" className="input-field h-20 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">السعر <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-text text-sm">د.م</span>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00" className="input-field pl-10" min="0" step="0.01" required />
              </div>
            </div>
            <div>
              <label className="label">الكمية <span className="text-red-500">*</span></label>
              <input type="number" value={stock} onChange={(e) => setStock(e.target.value)}
                placeholder="0" className="input-field" min="0" required />
            </div>
          </div>

          <div>
            <label className="label">وحدة القياس <span className="text-red-500">*</span></label>
            <select value={unit} onChange={(e) => setUnit(e.target.value)} className="input-field" required>
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          <div>
            <label className="label">
              صورة المنتج
              <span className="text-gray-text font-normal text-xs mr-1">(اختياري — حتى 5MB)</span>
            </label>
            <label className="block border-2 border-dashed border-border rounded-xl p-5 text-center cursor-pointer hover:border-gold transition-colors">
              {imagePreview ? (
                <img src={imagePreview} alt="preview" className="h-28 mx-auto object-cover rounded-lg" />
              ) : (
                <>
                  <Upload size={24} className="text-gold mx-auto mb-2" />
                  <p className="text-sm text-gray-text">اسحب صورة أو اضغط للاختيار</p>
                </>
              )}
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-2.5 disabled:opacity-60">
              {loading
                ? <><Loader2 size={16} className="animate-spin" /><span>جارِ الحفظ...</span></>
                : <span>{editingProduct ? "حفظ التعديلات" : "حفظ المنتج"}</span>}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  الصفحة الرئيسية
// ════════════════════════════════════════════════════════════════════════════
const STOCK_FILTERS = [
  { value: "", label: "الكل" },
  { value: "low", label: "مخزون منخفض" },
  { value: "out", label: "نفد المخزون" },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<PaginatedResponse<Product> | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [stockStatus, setStockStatus] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productsApi.list({
        search: search || undefined,
        category_id: selectedCategory ? Number(selectedCategory) : undefined,
        stock_status: stockStatus || undefined,
        page,
        per_page: 10,
      });
      setProducts(res.data);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, stockStatus, page]);

  useEffect(() => {
    productsApi.categories().then((res) => setCategories(res.data));
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
    setDeletingId(id);
    try {
      await productsApi.delete(id);
      fetchProducts();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <Topbar title="المنتجات" breadcrumb={[{ label: "الرئيسية" }, { label: "المنتجات" }]} />

      <div className="p-3 sm:p-6">
        {/* شريط الأدوات */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex gap-3">
            <button onClick={() => { setEditingProduct(null); setModalOpen(true); }} className="btn-primary">
              <Plus size={16} />
              <span>منتج جديد</span>
            </button>
          </div>
        </div>

        {/* الفلاتر */}
        <div className="card mb-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-text" />
              <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                placeholder="ابحث عن منتج..." className="input-field pr-8" />
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

            <div className="flex gap-2">
              {STOCK_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => { setStockStatus(f.value); setPage(1); }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    stockStatus === f.value
                      ? "bg-navy text-white border-navy"
                      : "border-border text-gray-text hover:border-navy hover:text-navy"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* الجدول */}
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-cream border-b border-border">
              <tr>
                <th className="text-right text-sm font-semibold text-dark px-4 py-3">المنتج</th>
                <th className="text-right text-sm font-semibold text-dark px-4 py-3">الفئة</th>
                <th className="text-right text-sm font-semibold text-dark px-4 py-3">السعر</th>
                <th className="text-right text-sm font-semibold text-dark px-4 py-3">المخزون</th>
                <th className="text-right text-sm font-semibold text-dark px-4 py-3">الوحدة</th>
                <th className="text-right text-sm font-semibold text-dark px-4 py-3">الوصف</th>
                <th className="text-right text-sm font-semibold text-dark px-4 py-3">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-20">
                    <Loader2 size={32} className="animate-spin text-gold mx-auto" />
                  </td>
                </tr>
              ) : products?.data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-20">
                    <Package size={40} className="text-border mx-auto mb-3" />
                    <p className="text-gray-text">لا توجد منتجات</p>
                  </td>
                </tr>
              ) : (
                products?.data.map((product) => (
                  <tr key={product.id} className="border-b border-border last:border-0 hover:bg-cream/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-cream border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {product.image
                            ? <img src={`http://localhost:8000/storage/${product.image}`} alt={product.name} className="w-full h-full object-cover" />
                            : <Package size={20} className="text-gray-text" />}
                        </div>
                        <span className="font-semibold text-dark text-sm">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {product.category
                        ? <CategoryBadge name={product.category.name} />
                        : <span className="text-gray-text text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 font-semibold text-dark text-sm whitespace-nowrap">
                      {Number(product.price).toLocaleString("ar-MA")} د.م
                    </td>
                    <td className="px-4 py-3">
                      <StockBadge stock={product.stock} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-text">{product.unit}</td>
                    <td className="px-4 py-3 text-gray-text text-sm max-w-xs">
                      <p className="line-clamp-2">{product.description ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditingProduct(product); setModalOpen(true); }}
                          className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-gray-text hover:border-gold hover:text-gold transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          disabled={deletingId === product.id}
                          className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-gray-text hover:border-red-400 hover:text-red-500 transition-colors disabled:opacity-50"
                        >
                          {deletingId === product.id
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
        {products && products.last_page > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-text">
              من {(products.current_page - 1) * products.per_page + 1} إلى{" "}
              {Math.min(products.current_page * products.per_page, products.total)} من{" "}
              {products.total} منتج
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={products.current_page === 1}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-gray-text hover:border-gold hover:text-gold transition-colors disabled:opacity-40">
                <ChevronRight size={16} />
              </button>
              {Array.from({ length: products.last_page }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - products.current_page) <= 2)
                .map((p) => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      p === products.current_page ? "bg-gold text-navy" : "border border-border text-gray-text hover:border-gold hover:text-gold"
                    }`}>
                    {p}
                  </button>
                ))}
              <button onClick={() => setPage((p) => Math.min(products.last_page, p + 1))} disabled={products.current_page === products.last_page}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-gray-text hover:border-gold hover:text-gold transition-colors disabled:opacity-40">
                <ChevronLeft size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <ProductModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingProduct(null); }}
        onSave={fetchProducts}
        categories={categories}
        setCategories={setCategories}
        editingProduct={editingProduct}
      />
    </div>
  );
}