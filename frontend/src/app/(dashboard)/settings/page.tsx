"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { settingsApi } from "@/lib/api";
import {
  Store, User,
  Bell, Shield, HardDrive, Settings2,
  Camera, Eye, EyeOff, Check, AlertCircle, Loader2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface BusinessForm {
  name: string; phone: string; email: string;
  address: string; city: string; description: string;
  logo: string | null; cover_image: string | null;
}
interface AccountForm { name: string; email: string; }
interface PasswordForm { current_password: string; password: string; password_confirmation: string; }

// ─── Shared helpers ───────────────────────────────────────────────────────────

type AlertType = "success" | "error";

function Alert({ type, message, onClose }: { type: AlertType; message: string; onClose: () => void }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${
      type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"
    }`}>
      {type === "success" ? <Check size={15} className="shrink-0"/> : <AlertCircle size={15} className="shrink-0"/>}
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="text-current opacity-50 hover:opacity-80 text-lg leading-none">×</button>
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all bg-white";

// ─── Business Settings ────────────────────────────────────────────────────────

function BusinessSection() {
  const [form, setForm]       = useState<BusinessForm>({ name:"", phone:"", email:"", address:"", city:"", description:"", logo:null, cover_image:null });
  const [logoFile,  setLogoFile]  = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [logoPreview,  setLogoPreview]  = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [saving,  setSaving]  = useState(false);
  const [loading, setLoading] = useState(true);
  const [alert,   setAlert]   = useState<{ type: AlertType; message: string } | null>(null);
  const logoRef  = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    settingsApi.getBusiness().then(res => {
      setForm(res.data);
      setLogoPreview(res.data.logo);
      setCoverPreview(res.data.cover_image);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleFile = (file: File, type: "logo" | "cover") => {
    const url = URL.createObjectURL(file);
    if (type === "logo")  { setLogoFile(file);  setLogoPreview(url); }
    else                  { setCoverFile(file); setCoverPreview(url); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setAlert(null);
    try {
      const fd = new FormData();
      fd.append("name",        form.name);
      fd.append("phone",       form.phone       ?? "");
      fd.append("email",       form.email       ?? "");
      fd.append("address",     form.address     ?? "");
      fd.append("city",        form.city        ?? "");
      fd.append("description", form.description ?? "");
      if (logoFile)  fd.append("logo",        logoFile);
      if (coverFile) fd.append("cover_image", coverFile);
      await settingsApi.updateBusiness(fd);
      setAlert({ type: "success", message: "تم حفظ إعدادات المحل بنجاح" });
      setLogoFile(null); setCoverFile(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "حدث خطأ أثناء الحفظ";
      setAlert({ type: "error", message: msg });
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="space-y-4">{[1,2,3,4].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)}/>}

      {/* Cover image */}
      <Field label="صورة الغلاف" hint="JPG أو PNG، الحجم الأقصى 4MB">
        <div className="relative h-36 bg-gray-100 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-rose-300 transition-colors cursor-pointer group"
          onClick={() => coverRef.current?.click()}>
          {coverPreview
            ? <img src={coverPreview} alt="cover" className="w-full h-full object-cover"/>
            : <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                <Camera size={28} className="opacity-40"/>
                <span className="text-sm">اضغط لرفع صورة الغلاف</span>
              </div>
          }
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-sm font-medium flex items-center gap-2"><Camera size={16}/>تغيير الصورة</span>
          </div>
          <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0], "cover")}/>
        </div>
      </Field>

      {/* Logo */}
      <Field label="شعار المحل" hint="JPG أو PNG، الحجم الأقصى 2MB، يُفضل مربع">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 hover:border-rose-300 transition-colors cursor-pointer group relative overflow-hidden bg-gray-50 flex items-center justify-center shrink-0"
            onClick={() => logoRef.current?.click()}>
            {logoPreview
              ? <img src={logoPreview} alt="logo" className="w-full h-full object-cover"/>
              : <Camera size={22} className="text-gray-300"/>
            }
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera size={16} className="text-white"/>
            </div>
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0], "logo")}/>
          </div>
          <div className="text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">شعار المحل</p>
            <p className="text-xs text-gray-400">اضغط على الصورة لتغييرها</p>
            {logoFile && <p className="text-xs text-rose-500 mt-1">{logoFile.name}</p>}
          </div>
        </div>
      </Field>

      {/* Name + Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="اسم المحل *">
          <input className={inputCls} value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required placeholder="قاعة نور الأفراح"/>
        </Field>
        <Field label="رقم الهاتف">
          <input className={inputCls} value={form.phone ?? ""} onChange={e => setForm(f => ({...f, phone: e.target.value}))} placeholder="+213XXXXXXXXX" dir="ltr"/>
        </Field>
      </div>

      {/* Email + City */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="البريد الإلكتروني">
          <input className={inputCls} type="email" value={form.email ?? ""} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="info@example.com" dir="ltr"/>
        </Field>
        <Field label="المدينة">
          <input className={inputCls} value={form.city ?? ""} onChange={e => setForm(f => ({...f, city: e.target.value}))} placeholder="الجزائر"/>
        </Field>
      </div>

      {/* Address */}
      <Field label="العنوان">
        <input className={inputCls} value={form.address ?? ""} onChange={e => setForm(f => ({...f, address: e.target.value}))} placeholder="الشارع، الحي، الرمز البريدي"/>
      </Field>

      {/* Description */}
      <Field label="وصف المحل" hint="يظهر في الفواتير والمطبوعات">
        <textarea className={`${inputCls} resize-none`} rows={3} value={form.description ?? ""} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="وصف مختصر عن المحل وخدماته..."/>
      </Field>

      <div className="flex justify-end pt-2">
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60">
          {saving ? <Loader2 size={15} className="animate-spin"/> : <Check size={15}/>}
          {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
        </button>
      </div>
    </form>
  );
}

// ─── Account Settings ─────────────────────────────────────────────────────────

function AccountSection() {
  const [form,    setForm]    = useState<AccountForm>({ name: "", email: "" });
  const [pwForm,  setPwForm]  = useState<PasswordForm>({ current_password: "", password: "", password_confirmation: "" });
  const [showPw,  setShowPw]  = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [savingPw,setSavingPw]= useState(false);
  const [alert,   setAlert]   = useState<{ type: AlertType; message: string } | null>(null);
  const [pwAlert, setPwAlert] = useState<{ type: AlertType; message: string } | null>(null);

  useEffect(() => {
    settingsApi.getAccount().then(res => setForm({ name: res.data.name, email: res.data.email }))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setAlert(null);
    try {
      await settingsApi.updateAccount(form);
      const stored = localStorage.getItem("auth_user");
      const user   = stored ? JSON.parse(stored) : {};
      localStorage.setItem("auth_user", JSON.stringify({ ...user, name: form.name }));
      window.dispatchEvent(new Event("user_updated"));
      setAlert({ type: "success", message: "تم حفظ بيانات الحساب بنجاح" });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "حدث خطأ أثناء الحفظ";
      setAlert({ type: "error", message: msg });
    } finally { setSaving(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.password !== pwForm.password_confirmation) {
      setPwAlert({ type: "error", message: "كلمة المرور الجديدة وتأكيدها غير متطابقين" }); return;
    }
    setSavingPw(true); setPwAlert(null);
    try {
      await settingsApi.changePassword(pwForm);
      setPwAlert({ type: "success", message: "تم تغيير كلمة المرور بنجاح" });
      setPwForm({ current_password: "", password: "", password_confirmation: "" });
    } catch (err: unknown) {
      const errs = (err as { response?: { data?: { errors?: Record<string,string[]>; message?: string } } })?.response?.data;
      const msg  = errs?.errors?.current_password?.[0] ?? errs?.message ?? "حدث خطأ";
      setPwAlert({ type: "error", message: msg });
    } finally { setSavingPw(false); }
  };

  if (loading) return (
    <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
  );

  return (
    <div className="space-y-8">

      {/* Profile info */}
      <form onSubmit={handleSaveAccount} className="space-y-5">
        <h3 className="text-sm font-bold text-gray-700 pb-2 border-b border-gray-100">معلومات الحساب</h3>
        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)}/>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="الاسم الكامل *">
            <input className={inputCls} value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required placeholder="محمد الإدريسي"/>
          </Field>
          <Field label="البريد الإلكتروني *">
            <input className={inputCls} type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} required placeholder="admin@example.com" dir="ltr"/>
          </Field>
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60">
            {saving ? <Loader2 size={15} className="animate-spin"/> : <Check size={15}/>}
            {saving ? "جاري الحفظ..." : "حفظ البيانات"}
          </button>
        </div>
      </form>

      {/* Password change */}
      <form onSubmit={handleChangePassword} className="space-y-5">
        <h3 className="text-sm font-bold text-gray-700 pb-2 border-b border-gray-100">تغيير كلمة المرور</h3>
        {pwAlert && <Alert type={pwAlert.type} message={pwAlert.message} onClose={() => setPwAlert(null)}/>}
        <Field label="كلمة المرور الحالية">
          <div className="relative">
            <input className={`${inputCls} pl-10`} type={showPw.current ? "text" : "password"}
              value={pwForm.current_password} onChange={e => setPwForm(f => ({...f, current_password: e.target.value}))}
              required placeholder="••••••••" dir="ltr"/>
            <button type="button" onClick={() => setShowPw(s => ({...s, current: !s.current}))}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPw.current ? <EyeOff size={15}/> : <Eye size={15}/>}
            </button>
          </div>
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="كلمة المرور الجديدة" hint="8 أحرف على الأقل">
            <div className="relative">
              <input className={`${inputCls} pl-10`} type={showPw.new ? "text" : "password"}
                value={pwForm.password} onChange={e => setPwForm(f => ({...f, password: e.target.value}))}
                required minLength={8} placeholder="••••••••" dir="ltr"/>
              <button type="button" onClick={() => setShowPw(s => ({...s, new: !s.new}))}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw.new ? <EyeOff size={15}/> : <Eye size={15}/>}
              </button>
            </div>
          </Field>
          <Field label="تأكيد كلمة المرور الجديدة">
            <div className="relative">
              <input className={`${inputCls} pl-10`} type={showPw.confirm ? "text" : "password"}
                value={pwForm.password_confirmation} onChange={e => setPwForm(f => ({...f, password_confirmation: e.target.value}))}
                required placeholder="••••••••" dir="ltr"/>
              <button type="button" onClick={() => setShowPw(s => ({...s, confirm: !s.confirm}))}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw.confirm ? <EyeOff size={15}/> : <Eye size={15}/>}
              </button>
            </div>
          </Field>
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={savingPw}
            className="flex items-center gap-2 px-6 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60">
            {savingPw ? <Loader2 size={15} className="animate-spin"/> : <Shield size={15}/>}
            {savingPw ? "جاري الحفظ..." : "تغيير كلمة المرور"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Coming Soon placeholder ──────────────────────────────────────────────────

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <Settings2 size={28} className="text-gray-300"/>
      </div>
      <h3 className="text-base font-semibold text-gray-500 mb-1">{label}</h3>
      <p className="text-sm text-gray-400">سيتم إضافة هذا القسم قريباً</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type TabKey = "business" | "account" | "notifications" | "backup" | "system";

const TABS: { key: TabKey; label: string; icon: React.ElementType; ready?: boolean }[] = [
  { key: "business",      label: "إعدادات المحل",       icon: Store,    ready: true },
  { key: "account",       label: "الحساب والمستخدم",    icon: User,     ready: true },
  { key: "notifications", label: "الإشعارات",           icon: Bell                  },
  { key: "backup",        label: "النسخ الاحتياطي",     icon: HardDrive             },
  { key: "system",        label: "إعدادات النظام",      icon: Settings2             },
];

const SECTION_TITLES: Record<TabKey, string> = {
  business:      "إعدادات المحل",
  account:       "إعدادات الحساب والمستخدم",
  notifications: "إعدادات الإشعارات",
  backup:        "النسخ الاحتياطي",
  system:        "إعدادات النظام",
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("business");

  return (
    <div className="min-h-screen bg-gray-50/60">

      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4">
        <h1 className="text-xl font-bold text-gray-800">الإعدادات</h1>
      </div>

      <div className="p-3 sm:p-5">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-start">

          {/* Sidebar nav */}
          <nav className="w-full sm:w-56 shrink-0 bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <ul className="divide-y divide-gray-50">
              {TABS.map(tab => {
                const Icon    = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <li key={tab.key}>
                    <button onClick={() => setActiveTab(tab.key)} className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                        isActive ? "bg-rose-50 text-rose-600 font-semibold" : "text-gray-600 hover:bg-gray-50"
                      }`}>
                      <Icon size={16} className={isActive ? "text-rose-500" : "text-gray-400"}/>
                      <span className="flex-1 text-right">{tab.label}</span>
                      {!tab.ready && (
                        <span className="text-[9px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full font-medium">قريباً</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Content area */}
          <div className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
            <h2 className="text-base font-bold text-gray-800 mb-6 pb-3 border-b border-gray-100">
              {SECTION_TITLES[activeTab]}
            </h2>

            {activeTab === "business"  && <BusinessSection/>}
            {activeTab === "account"   && <AccountSection/>}
            {activeTab !== "business"  && activeTab !== "account" && <ComingSoon label={SECTION_TITLES[activeTab]}/>}
          </div>

        </div>
      </div>
    </div>
  );
}