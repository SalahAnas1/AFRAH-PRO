"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authApi } from "@/lib/api";
import {
  LayoutDashboard, Building2, Users, CreditCard,
  BarChart3, Bell, FileText, Megaphone, Settings2, HeadphonesIcon,
  LogOut, Crown, X,
} from "lucide-react";
import clsx from "clsx";
import { useLanguage } from "@/context/LanguageContext";

interface SidebarProps { open?: boolean; onClose?: () => void; }

export default function SuperAdminSidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const { t, dir } = useLanguage();

  const navItems = [
    { key: "superAdmin.nav.dashboard",    href: "/super-admin/dashboard",      icon: LayoutDashboard },
    { key: "superAdmin.nav.businesses",   href: "/super-admin/businesses",     icon: Building2       },
    { key: "superAdmin.nav.owners",       href: "/super-admin/owners",         icon: Users           },
    { key: "superAdmin.nav.subscriptions",href: "/super-admin/subscriptions",  icon: CreditCard      },
    { key: "superAdmin.nav.reports",      href: "/super-admin/reports",        icon: BarChart3       },
    { key: "superAdmin.nav.notifications",href: "/super-admin/notifications",  icon: Bell            },
    { key: "superAdmin.nav.logs",         href: "/super-admin/logs",           icon: FileText        },
    { key: "superAdmin.nav.advertisements",href: "/super-admin/advertisements",icon: Megaphone       },
    { key: "superAdmin.nav.systemSettings",href: "/super-admin/settings",     icon: Settings2       },
    { key: "superAdmin.nav.support",      href: "/super-admin/support",        icon: HeadphonesIcon  },
  ];

  const [userName, setUserName] = useState("");
  const hiddenTranslate = dir === "rtl" ? "translate-x-full" : "-translate-x-full";

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    router.push("/login");
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem("auth_user");
      if (stored) {
        const user = JSON.parse(stored);
        if (user?.name) setUserName(user.name);
      }
    } catch {}
  }, []);

  return (
    <aside className={clsx(
      "fixed start-0 top-0 h-screen w-[210px] bg-navy flex flex-col z-50 shadow-xl",
      "transition-transform duration-300 ease-in-out lg:translate-x-0",
      open ? "translate-x-0" : hiddenTranslate
    )}>
      <button onClick={onClose} className="lg:hidden absolute end-3 top-3 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center" aria-label={t("superAdmin.closeMenu")}>
        <X size={16} className="text-white" />
      </button>

      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center flex-shrink-0">
            <Crown size={20} className="text-navy" />
          </div>
          <div>
            <h1 className="text-white font-bold text-[15px]">AFRAH PRO</h1>
            <p className="text-white/30 text-[11px]">{t("superAdmin.subtitle")}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2.5">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link href={item.href} onClick={onClose} className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group border-s-[3px]",
                  isActive ? "bg-gold/15 text-gold border-gold" : "text-white/50 hover:text-white/80 hover:bg-white/5 border-transparent"
                )}>
                  <Icon size={17} className={clsx(isActive ? "text-gold" : "text-white/35 group-hover:text-white/60")} />
                  <span className="text-sm font-medium">{t(item.key)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-2.5 mb-3 px-1">
          <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center flex-shrink-0">
            <span className="text-navy text-xs font-bold">S</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{userName || t("superAdmin.title")}</p>
            <p className="text-white/35 text-xs">{t("superAdmin.role")}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-white/35 hover:text-red-400 text-sm transition-colors w-full px-1 py-1 rounded-lg hover:bg-red-500/10">
          <LogOut size={15} />
          <span>{t("superAdmin.logout")}</span>
        </button>
      </div>
    </aside>
  );
}