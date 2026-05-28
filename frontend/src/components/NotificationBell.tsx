"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bell, CalendarDays, Package, ReceiptText, Users,
  Store, Settings, TrendingUp, Check, Trash2,
  AlertCircle, Loader2, X,
} from "lucide-react";
import { notificationsApi } from "@/lib/api";

type NotifType = "booking" | "inventory" | "invoice" | "worker" | "business" | "system" | "financial";

interface Notification {
  id: number;
  type: NotifType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const TYPE_CFG: Record<NotifType, { icon: React.ElementType; color: string; bg: string }> = {
  booking:   { icon: CalendarDays, color: "text-blue-600",   bg: "bg-blue-50"   },
  inventory: { icon: Package,      color: "text-orange-500", bg: "bg-orange-50" },
  invoice:   { icon: ReceiptText,  color: "text-purple-600", bg: "bg-purple-50" },
  worker:    { icon: Users,        color: "text-cyan-600",   bg: "bg-cyan-50"   },
  business:  { icon: Store,        color: "text-gold",       bg: "bg-amber-50"  },
  system:    { icon: Settings,     color: "text-gray-500",   bg: "bg-gray-100"  },
  financial: { icon: TrendingUp,   color: "text-emerald-600",bg: "bg-emerald-50"},
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)   return "الآن";
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400)return `منذ ${Math.floor(diff / 3600)} ساعة`;
  return `منذ ${Math.floor(diff / 86400)} يوم`;
}

export default function NotificationBell() {
  const [open,    setOpen]    = useState(false);
  const [notifs,  setNotifs]  = useState<Notification[]>([]);
  const [unread,  setUnread]  = useState(0);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // ── جلب عدد الإشعارات غير المقروءة ───────────────────────────────
  const fetchCount = useCallback(async () => {
    try {
      const res = await notificationsApi.unreadCount();
      setUnread(res.data.count);
    } catch { /* silent */ }
  }, []);

  // ── جلب قائمة الإشعارات ────────────────────────────────────────
  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await notificationsApi.list();
      setNotifs(res.data.data ?? res.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── polling كل 30 ثانية للعدد ──────────────────────────────────
  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30_000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  // ── جلب عند فتح القائمة ────────────────────────────────────────
  useEffect(() => {
    if (open) fetchNotifs();
  }, [open, fetchNotifs]);

  // ── إغلاق عند الضغط خارج ──────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── تحديد إشعار كمقروء ─────────────────────────────────────────
  const markOne = async (id: number) => {
    const notif = notifs.find(n => n.id === id);
    if (!notif || notif.is_read) return;
    try {
      await notificationsApi.markRead(id);
      setNotifs(ns => ns.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnread(u => Math.max(0, u - 1));
    } catch { /* silent */ }
  };

  // ── تحديد الكل كمقروء ─────────────────────────────────────────
  const markAll = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifs(ns => ns.map(n => ({ ...n, is_read: true })));
      setUnread(0);
    } catch { /* silent */ }
  };

  // ── حذف إشعار ─────────────────────────────────────────────────
  const deleteOne = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const notif = notifs.find(n => n.id === id);
    try {
      await notificationsApi.delete(id);
      setNotifs(ns => ns.filter(n => n.id !== id));
      if (notif && !notif.is_read) setUnread(u => Math.max(0, u - 1));
    } catch { /* silent */ }
  };

  return (
    <div ref={ref} className="relative">

      {/* ── Bell button ── */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
          open ? "bg-amber-50" : "hover:bg-gray-100"
        }`}
      >
        <Bell
          size={18}
          className={unread > 0 ? "text-amber-500" : "text-gray-400"}
          strokeWidth={unread > 0 ? 2.5 : 2}
        />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div className="absolute left-0 top-[calc(100%+10px)] w-[340px] bg-white rounded-2xl border border-gray-200 shadow-2xl shadow-gray-200/60 z-50 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-gray-500" />
              <span className="text-sm font-bold text-gray-800">الإشعارات</span>
              {unread > 0 && (
                <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full">
                  {unread} جديد
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={markAll}
                className="flex items-center gap-1 text-[11px] text-rose-500 hover:text-rose-700 transition-colors"
              >
                <Check size={11} /> تحديد الكل كمقروء
              </button>
            )}
          </div>

          {/* Body */}
          <div className="max-h-[360px] overflow-y-auto">

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center gap-2 py-10 text-gray-400">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-sm">جاري التحميل...</span>
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
                <AlertCircle size={28} className="text-red-400" />
                <p className="text-sm">تعذّر تحميل الإشعارات</p>
                <button
                  onClick={fetchNotifs}
                  className="text-xs text-blue-500 hover:underline"
                >
                  إعادة المحاولة
                </button>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && notifs.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
                <Bell size={28} className="opacity-30" />
                <p className="text-sm">لا توجد إشعارات</p>
              </div>
            )}

            {/* List */}
            {!loading && !error && notifs.map(n => {
              const cfg  = TYPE_CFG[n.type] ?? TYPE_CFG.system;
              const Icon = cfg.icon;
              return (
                <div
                  key={n.id}
                  onClick={() => markOne(n.id)}
                  className={`group flex gap-3 px-4 py-3.5 cursor-pointer hover:bg-gray-50/80 transition-colors border-b border-gray-50 ${
                    !n.is_read ? "bg-blue-50/25" : ""
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon size={14} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-gray-800 leading-tight">{n.title}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                        <button
                          onClick={(e) => deleteOne(e, n.id)}
                          className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1.5">{timeAgo(n.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          {!loading && !error && notifs.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/60 text-center">
              <button
                onClick={fetchNotifs}
                className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
              >
                تحديث الإشعارات
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
}