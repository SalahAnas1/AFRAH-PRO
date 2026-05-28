"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Plus, Megaphone, Loader2, Pencil, Trash2,
  ToggleLeft, ToggleRight, ExternalLink, Calendar, X,
  LayoutTemplate, SidebarOpen,
} from "lucide-react";
import { advertisementsApi } from "@/lib/api";

const STORAGE_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api").replace("/api", "");

interface Advertisement {
  id: number;
  title: string;
  description: string | null;
  image: string | null;
  link: string | null;
  status: "active" | "inactive";
  ad_type: "large" | "small";
  start_date: string;
  end_date: string;
  created_by: number;
  creator?: { id: number; name: string };
  created_at: string;
}

const EMPTY_FORM = {
  title:       "",
  description: "",
  link:        "",
  status:      "inactive" as "active" | "inactive",
  ad_type:     "small"    as "large" | "small",
  start_date:  "",
  end_date:    "",
};

type Modal =
  | { type: "none" }
  | { type: "add" }
  | { type: "edit"; ad: Advertisement }
  | { type: "delete"; ad: Advertisement };

export default function AdvertisementsPage() {
  const [ads,     setAds]     = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState<Modal>({ type: "none" });
  const [toast,   setToast]   = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const [form,         setForm]         = useState({ ...EMPTY_FORM });
  const [imageFile,    setImageFile]    = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAds = useCallback(async () => {
    try {
      setLoading(true);
      const res = await advertisementsApi.superAdmin.list();
      setAds(res.data);
    } catch {
      showToast("تعذّر تحميل الإعلانات", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAds(); }, [fetchAds]);

  const openAdd = () => {
    setForm({ ...EMPTY_FORM });
    setImageFile(null);
    setImagePreview(null);
    setModal({ type: "add" });
  };

  const openEdit = (ad: Advertisement) => {
    setForm({
      title:       ad.title,
      description: ad.description ?? "",
      link:        ad.link ?? "",
      status:      ad.status,
      ad_type:     ad.ad_type,
      start_date:  ad.start_date,
      end_date:    ad.end_date,
    });
    setImageFile(null);
    setImagePreview(ad.image ? `${STORAGE_URL}/storage/${ad.image}` : null);
    setModal({ type: "edit", ad });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append("title",      form.title);
    fd.append("status",     form.status);
    fd.append("ad_type",    form.ad_type);
    fd.append("start_date", form.start_date);
    fd.append("end_date",   form.end_date);
    if (form.description.trim()) fd.append("description", form.description);
    if (form.link.trim())        fd.append("link",        form.link);
    if (imageFile)               fd.append("image",       imageFile);
    return fd;
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.start_date || !form.end_date) {
      showToast("يرجى ملء العنوان وتاريخ البداية والنهاية", "error");
      return;
    }
    setSaving(true);
    try {
      const fd = buildFormData();
      if (modal.type === "add") {
        await advertisementsApi.superAdmin.create(fd);
        showToast("تم إضافة الإعلان بنجاح");
      } else if (modal.type === "edit") {
        await advertisementsApi.superAdmin.update(modal.ad.id, fd);
        showToast("تم تحديث الإعلان بنجاح");
      }
      setModal({ type: "none" });
      fetchAds();
    } catch {
      showToast("حدث خطأ أثناء الحفظ", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (ad: Advertisement) => {
    try {
      const fd = new FormData();
      fd.append("title",      ad.title);
      fd.append("status",     ad.status === "active" ? "inactive" : "active");
      fd.append("ad_type",    ad.ad_type);
      fd.append("start_date", ad.start_date);
      fd.append("end_date",   ad.end_date);
      if (ad.description) fd.append("description", ad.description);
      if (ad.link)         fd.append("link",        ad.link);
      await advertisementsApi.superAdmin.update(ad.id, fd);
      setAds((prev) =>
        prev.map((a) =>
          a.id === ad.id
            ? { ...a, status: a.status === "active" ? "inactive" : "active" }
            : a
        )
      );
      showToast(ad.status === "active" ? "تم تعطيل الإعلان" : "تم تفعيل الإعلان");
    } catch {
      showToast("تعذّر تغيير الحالة", "error");
    }
  };

  const handleDelete = async () => {
    if (modal.type !== "delete") return;
    setDeleting(true);
    try {
      await advertisementsApi.superAdmin.delete(modal.ad.id);
      setAds((prev) => prev.filter((a) => a.id !== modal.ad.id));
      setModal({ type: "none" });
      showToast("تم حذف الإعلان بنجاح");
    } catch {
      showToast("تعذّر حذف الإعلان", "error");
    } finally {
      setDeleting(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  const getStatusBadge = (ad: Advertisement) => {
    if (ad.end_date < today)
      return <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-500">منتهي</span>;
    if (ad.start_date > today)
      return <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-600">لم يبدأ</span>;
    if (ad.status === "active")
      return <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-green-50 text-green-600">نشط</span>;
    return <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-orange-50 text-orange-600">معطّل</span>;
  };

  const getTypeBadge = (type: "large" | "small") =>
    type === "large" ? (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-600">
        <LayoutTemplate size={11} /> كبير
      </span>
    ) : (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-purple-50 text-purple-600">
        <SidebarOpen size={11} /> صغير
      </span>
    );

  const dimHint = form.ad_type === "large" ? {
    color: "blue",
    title: "إعلان كبير (Banner أفقي)",
    dims:  "1200 × 400 px",
    usage: "يظهر كشريط أفقي كبير أعلى لوحة تحكم الأدمن",
  } : {
    color: "purple",
    title: "إعلان صغير (Sidebar)",
    dims:  "300 × 250 px",
    usage: "يظهر كبطاقة صغيرة أسفل القائمة الجانبية للأدمن",
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-5">

      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-text mb-0.5">
            <span>الرئيسية</span><span>/</span>
            <span className="text-gold font-medium">الإعلانات</span>
          </div>
          <h1 className="text-[22px] font-bold text-dark">الإعلانات</h1>
          <p className="text-gray-text text-sm mt-0.5">إدارة الإعلانات التي تظهر في لوحة تحكم أصحاب المحلات</p>
        </div>
        <button onClick={openAdd} className="btn-primary text-sm">
          <Plus size={16} /><span>إضافة إعلان</span>
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* القائمة */}
      {loading ? (
        <div className="bg-white rounded-xl border border-border shadow-sm p-16 flex items-center justify-center gap-3">
          <Loader2 size={24} className="animate-spin text-gold" />
          <p className="text-gray-text text-sm">جارِ تحميل الإعلانات...</p>
        </div>
      ) : ads.length === 0 ? (
        <div className="bg-white rounded-xl border border-border shadow-sm p-16 flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center">
            <Megaphone size={28} className="text-gold" />
          </div>
          <p className="text-dark font-semibold text-lg">لا توجد إعلانات بعد</p>
          <p className="text-gray-text text-sm">أضف إعلاناً كبيراً أو صغيراً ليظهر لأصحاب المحلات</p>
          <button onClick={openAdd} className="btn-primary mt-2 text-sm">
            <Plus size={15} /><span>إضافة إعلان</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {ads.map((ad) => (
            <div key={ad.id} className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="flex flex-col sm:flex-row gap-4 p-4">

                {/* الصورة */}
                <div className="sm:w-44 sm:h-28 w-full h-44 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {ad.image ? (
                    <img src={`${STORAGE_URL}/storage/${ad.image}`} alt={ad.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Megaphone size={28} className="text-gray-300" />
                    </div>
                  )}
                </div>

                {/* التفاصيل */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-dark text-base leading-tight">{ad.title}</h3>
                      {ad.description && (
                        <p className="text-gray-text text-sm mt-0.5 line-clamp-2 leading-relaxed">{ad.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {getTypeBadge(ad.ad_type)}
                      {getStatusBadge(ad)}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-2.5 flex-wrap">
                    <span className="flex items-center gap-1.5 text-xs text-gray-text">
                      <Calendar size={12} />
                      <span>{ad.start_date} — {ad.end_date}</span>
                    </span>
                    {ad.link && (
                      <a href={ad.link} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-gold hover:underline">
                        <ExternalLink size={12} /><span>رابط الإعلان</span>
                      </a>
                    )}
                  </div>
                  {ad.creator && (
                    <p className="text-[11px] text-gray-text mt-1.5">أضافه: {ad.creator.name}</p>
                  )}
                </div>
              </div>

              {/* أزرار الإجراءات */}
              <div className="flex items-center gap-2 px-4 pb-4 pt-2 border-t border-gray-50">
                <button onClick={() => handleToggle(ad)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${
                    ad.status === "active"
                      ? "bg-orange-50 text-orange-600 hover:bg-orange-100"
                      : "bg-green-50 text-green-600 hover:bg-green-100"
                  }`}>
                  {ad.status === "active" ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
                  <span>{ad.status === "active" ? "تعطيل" : "تفعيل"}</span>
                </button>
                <button onClick={() => openEdit(ad)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                  <Pencil size={14} /><span>تعديل</span>
                </button>
                <button onClick={() => setModal({ type: "delete", ad })}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                  <Trash2 size={14} /><span>حذف</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ────── Modal الإضافة / التعديل ────── */}
      {(modal.type === "add" || modal.type === "edit") && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto">

            <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-white z-10">
              <h2 className="font-bold text-dark text-base">
                {modal.type === "add" ? "إضافة إعلان جديد" : "تعديل الإعلان"}
              </h2>
              <button onClick={() => setModal({ type: "none" })}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">

              {/* العنوان */}
              <div>
                <label className="label">العنوان <span className="text-red-500">*</span></label>
                <input className="input-field" placeholder="مثال: عرض موسم الزفاف"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
              </div>

              {/* نوع الإعلان */}
              <div>
                <label className="label">نوع الإعلان</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button"
                    onClick={() => setForm((p) => ({ ...p, ad_type: "large" }))}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      form.ad_type === "large"
                        ? "border-indigo-400 bg-indigo-50"
                        : "border-border hover:border-gray-300"
                    }`}>
                    <LayoutTemplate size={22} className={form.ad_type === "large" ? "text-indigo-500" : "text-gray-400"} />
                    <span className={`text-sm font-semibold ${form.ad_type === "large" ? "text-indigo-600" : "text-gray-600"}`}>
                      إعلان كبير
                    </span>
                    <span className="text-[10px] text-gray-400">Banner أفقي</span>
                  </button>
                  <button type="button"
                    onClick={() => setForm((p) => ({ ...p, ad_type: "small" }))}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      form.ad_type === "small"
                        ? "border-purple-400 bg-purple-50"
                        : "border-border hover:border-gray-300"
                    }`}>
                    <SidebarOpen size={22} className={form.ad_type === "small" ? "text-purple-500" : "text-gray-400"} />
                    <span className={`text-sm font-semibold ${form.ad_type === "small" ? "text-purple-600" : "text-gray-600"}`}>
                      إعلان صغير
                    </span>
                    <span className="text-[10px] text-gray-400">بطاقة Sidebar</span>
                  </button>
                </div>

                {/* تلميح الأبعاد */}
                <div className={`mt-2.5 rounded-xl p-3 text-xs border ${
                  form.ad_type === "large"
                    ? "bg-indigo-50 border-indigo-200"
                    : "bg-purple-50 border-purple-200"
                }`}>
                  <p className={`font-bold mb-1 ${form.ad_type === "large" ? "text-indigo-700" : "text-purple-700"}`}>
                    {dimHint.title}
                  </p>
                  <p className={`${form.ad_type === "large" ? "text-indigo-600" : "text-purple-600"}`}>
                    الأبعاد المقترحة: <strong>{dimHint.dims}</strong>
                  </p>
                  <p className={`mt-0.5 ${form.ad_type === "large" ? "text-indigo-500" : "text-purple-500"}`}>
                    {dimHint.usage}
                  </p>
                </div>
              </div>

              {/* الوصف */}
              <div>
                <label className="label">الوصف</label>
                <textarea className="input-field resize-none" rows={2}
                  placeholder="وصف مختصر..."
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
              </div>

              {/* الصورة + معاينة فورية */}
              <div>
                <label className="label">صورة الإعلان</label>
                <input type="file" accept="image/*" onChange={handleImageChange}
                  className="block w-full text-sm text-gray-text file:ml-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-gold/10 file:text-gold hover:file:bg-gold/20 cursor-pointer border border-border rounded-lg p-2" />
                <p className="text-[11px] text-gray-text mt-1">
                  {form.ad_type === "large" ? "مقترح: 1200×400 px" : "مقترح: 300×250 px"} — الحد الأقصى 5MB
                </p>

                {/* ── معاينة فورية حسب النوع ── */}
                {imagePreview && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-gray-text mb-2">معاينة الإعلان:</p>

                    {form.ad_type === "large" ? (
                      /* معاينة Banner كبير */
                      <div className="relative rounded-xl overflow-hidden border border-border shadow-sm" style={{ height: "110px" }}>
                        <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-l from-black/65 via-black/25 to-transparent" />
                        <div className="absolute inset-0 flex items-center justify-end px-4 gap-3">
                          <div className="text-right max-w-[55%]">
                            {form.title && (
                              <p className="text-white font-bold text-sm drop-shadow leading-tight line-clamp-1">{form.title}</p>
                            )}
                            {form.description && (
                              <p className="text-white/75 text-xs mt-0.5 line-clamp-1 drop-shadow">{form.description}</p>
                            )}
                            {form.link && (
                              <span className="mt-1.5 inline-flex items-center gap-1 bg-gold text-navy text-[10px] font-bold px-2.5 py-1 rounded-lg">
                                <ExternalLink size={10} /> عرض المزيد
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="absolute top-2 right-2 bg-black/40 text-white text-[10px] px-2 py-0.5 rounded-full">
                          Banner كبير
                        </span>
                      </div>
                    ) : (
                      /* معاينة بطاقة Sidebar صغيرة */
                      <div className="flex items-start gap-3">
                        <div className="bg-navy rounded-xl overflow-hidden border border-white/10 w-[160px] flex-shrink-0">
                          <div className="flex items-center gap-1 px-3 pt-2 pb-1">
                            <Megaphone size={9} className="text-gold" />
                            <span className="text-[9px] text-gold font-bold">إعلان</span>
                          </div>
                          <div className="mx-2.5 mb-2 rounded-md overflow-hidden" style={{ height: "75px" }}>
                            <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                          </div>
                          <div className="px-3 pb-3">
                            {form.title && (
                              <p className="text-white text-[11px] font-semibold leading-snug line-clamp-1">{form.title}</p>
                            )}
                            {form.description && (
                              <p className="text-white/40 text-[10px] mt-0.5 line-clamp-2">{form.description}</p>
                            )}
                            {form.link && (
                              <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-gold">
                                <ExternalLink size={9} /> عرض المزيد
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-text pt-1">
                          <p className="font-semibold text-dark mb-1">كيف يظهر للأدمن</p>
                          <p>هذه معاينة تقريبية</p>
                          <p>للبطاقة الجانبية</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* الرابط */}
              <div>
                <label className="label">رابط اختياري</label>
                <input className="input-field" placeholder="https://..." dir="ltr"
                  value={form.link}
                  onChange={(e) => setForm((p) => ({ ...p, link: e.target.value }))} />
              </div>

              {/* الحالة */}
              <div>
                <label className="label">الحالة</label>
                <select className="input-field" value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as "active" | "inactive" }))}>
                  <option value="active">نشط — يظهر لأصحاب المحلات</option>
                  <option value="inactive">غير نشط — مخفي</option>
                </select>
              </div>

              {/* التواريخ */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">تاريخ البداية <span className="text-red-500">*</span></label>
                  <input type="date" className="input-field" value={form.start_date}
                    onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} />
                </div>
                <div>
                  <label className="label">تاريخ النهاية <span className="text-red-500">*</span></label>
                  <input type="date" className="input-field" value={form.end_date}
                    onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-5 pb-5 sticky bottom-0 bg-white pt-3 border-t border-border">
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving && <Loader2 size={15} className="animate-spin" />}
                <span>{saving ? "جارِ الحفظ..." : "حفظ الإعلان"}</span>
              </button>
              <button onClick={() => setModal({ type: "none" })} className="btn-secondary flex-1">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* ────── Modal الحذف ────── */}
      {modal.type === "delete" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-6">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h3 className="font-bold text-dark text-lg">حذف الإعلان</h3>
              <p className="text-gray-text text-sm leading-relaxed">
                هل أنت متأكد من حذف إعلان{" "}
                <span className="font-semibold text-dark">"{modal.ad.title}"</span>؟
                <br />سيتم حذف الصورة أيضاً ولا يمكن التراجع.
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
                {deleting && <Loader2 size={15} className="animate-spin" />}
                <span>{deleting ? "جارِ الحذف..." : "تأكيد الحذف"}</span>
              </button>
              <button onClick={() => setModal({ type: "none" })} className="flex-1 btn-secondary py-2.5">إلغاء</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}