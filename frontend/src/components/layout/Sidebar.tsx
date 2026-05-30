"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authApi } from "@/lib/api";
import {
  LayoutDashboard, CalendarDays, Package, Sparkles,
  Users, Warehouse, FileText, BarChart3, Settings, LogOut, Crown, X,
} from "lucide-react";
import clsx from "clsx";
import DarkModeToggle from "@/components/DarkModeToggle";
import SidebarAdvertisement from "@/components/layout/SidebarAdvertisement";
import { useLanguage } from "@/context/LanguageContext";

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname       = usePathname();
  const router         = useRouter();
  const { t, dir }     = useLanguage();
  const [userName, setUserName] = useState("");

  const navItems = [
    { key: "nav.dashboard", href: "/dashboard",  icon: LayoutDashboard },
    { key: "nav.bookings",  href: "/bookings",   icon: CalendarDays    },
    { key: "nav.products",  href: "/products",   icon: Package         },
    { key: "nav.services",  href: "/services",   icon: Sparkles        },
    { key: "nav.workers",   href: "/workers",    icon: Users           },
    { key: "nav.inventory", href: "/inventory",  icon: Warehouse       },
    { key: "nav.invoices",  href: "/invoices",   icon: FileText        },
    { key: "nav.reports",   href: "/reports",    icon: BarChart3       },
    { key: "nav.settings",  href: "/settings",   icon: Settings        },
  ];

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    router.push("/login");
  };

  useEffect(() => {
    const readName = () => {
      try {
        const stored = localStorage.getItem("auth_user");
        if (stored) {
          const user = JSON.parse(stored);
          if (user?.name) setUserName(user.name);
        }
      } catch {}
    };
    readName();
    window.addEventListener("user_updated", readName);
    return () => window.removeEventListener("user_updated", readName);
  }, []);

  // تحريك الـ Sidebar: RTL→ يمين / LTR→ يسار
  const hiddenTranslate = dir === "rtl" ? "translate-x-full" : "-translate-x-full";

  return (
    <aside
      className={clsx(
        // start-0 = inset-inline-start: 0 → يمين في RTL / يسار في LTR
        "fixed start-0 top-0 h-screen w-[210px] bg-navy flex flex-col z-50 shadow-xl",
        "transition-transform duration-300 ease-in-out",
        "lg:translate-x-0",
        open ? "translate-x-0" : hiddenTranslate
      )}
    >
      {/* زر الإغلاق — موبايل فقط — end-3 = دائماً الجانب الداخلي */}
      <button
        onClick={onClose}
        className="lg:hidden absolute end-3 top-3 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"
        aria-label={t("nav.closeMenu")}
      >
        <X size={16} className="text-white" />
      </button>

      {/* الشعار */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center flex-shrink-0">
            <Crown size={20} className="text-navy" />
          </div>
          <div>
            <h1 className="text-white font-bold text-[15px]">AFRAH PRO</h1>
            <p className="text-white/30 text-[11px]">{t("nav.appDesc")}</p>
          </div>
        </div>
      </div>

      {/* قائمة التنقل */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={clsx(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group border-s-[3px]",
                    isActive
                      ? "bg-gold/15 text-gold border-gold"
                      : "text-white/50 hover:text-white/80 hover:bg-white/5 border-transparent"
                  )}
                >
                  <Icon
                    size={17}
                    className={clsx(
                      isActive ? "text-gold" : "text-white/35 group-hover:text-white/60"
                    )}
                  />
                  <span className="text-sm font-medium">{t(item.key)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <SidebarAdvertisement />

      {/* معلومات المستخدم */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-2.5 mb-3 px-1">
          <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center flex-shrink-0">
            <span className="text-navy text-xs font-bold">م</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{userName || t("nav.sysAdmin")}</p>
            <p className="text-white/35 text-xs">{t("nav.sysAdmin")}</p>
          </div>
        </div>
        <div className="flex items-center justify-between mb-1">
          <DarkModeToggle compact={false} />
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-white/35 hover:text-red-400 text-sm transition-colors w-full px-1 py-1 rounded-lg hover:bg-red-500/10">
          <LogOut size={15} />
          <span>{t("nav.logout")}</span>
        </button>
      </div>
    </aside>
  );
}