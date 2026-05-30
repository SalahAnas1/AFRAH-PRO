"use client";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Crown, LayoutDashboard, Store, Users, CreditCard,
  BarChart3, Bell, FileText, Settings, LifeBuoy, LogOut, X, Megaphone,
} from "lucide-react";
import clsx from "clsx";
import { authApi } from "@/lib/api";
import DarkModeToggle from "@/components/DarkModeToggle";

const navItems = [
  { label: "لوحة التحكم",    href: "/super-admin/dashboard",     icon: LayoutDashboard },
  { label: "المحلات",        href: "/super-admin/businesses",     icon: Store           },
  { label: "أصحاب المحلات", href: "/super-admin/owners",         icon: Users           },
  { label: "الاشتراكات",     href: "/super-admin/subscriptions",  icon: CreditCard      },
  { label: "التقارير العامة",href: "/super-admin/reports",        icon: BarChart3       },
  { label: "الإشعارات",      href: "/super-admin/notifications",  icon: Bell            },
  { label: "سجل النظام",     href: "/super-admin/logs",           icon: FileText        },
  { label: "الإعلانات",       href: "/super-admin/advertisements", icon: Megaphone       },
  { label: "إعدادات النظام", href: "/super-admin/settings",       icon: Settings        },
  { label: "الدعم الفني",    href: "/super-admin/support",        icon: LifeBuoy        },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export default function SuperAdminSidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    router.push("/login");
  };

  return (
    <aside
      className={clsx(
        "fixed right-0 top-0 h-screen w-[210px] bg-navy flex flex-col z-50 shadow-xl",
        "transition-transform duration-300 ease-in-out",
        "lg:translate-x-0",
        open ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* زر الإغلاق — موبايل فقط */}
      <button
        onClick={onClose}
        className="lg:hidden absolute left-3 top-3 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"
        aria-label="إغلاق القائمة"
      >
        <X size={16} className="text-white" />
      </button>

      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center flex-shrink-0">
            <Crown size={20} className="text-navy" />
          </div>
          <div>
            <h1 className="text-white font-bold text-[15px]">AFRAH PRO</h1>
            <p className="text-white/30 text-[10px]">منصة SaaS — سوبر أدمن</p>
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
                <Link href={item.href}
                  onClick={onClose}
                  className={clsx(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group border-r-[3px]",
                    isActive
                      ? "bg-gold/15 text-gold border-gold"
                      : "text-white/50 hover:text-white/80 hover:bg-white/5 border-transparent"
                  )}>
                  <Icon size={17} className={clsx(isActive ? "text-gold" : "text-white/35 group-hover:text-white/60")} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-2.5 mb-3 px-1">
          <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center flex-shrink-0">
            <span className="text-navy text-xs font-bold">SA</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">سوبر أدمن</p>
            <p className="text-white/35 text-xs">مدير المنصة</p>
          </div>
        </div>
        <div className="flex items-center justify-between mb-1">
          <DarkModeToggle compact={false} />
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-white/35 hover:text-red-400 text-sm transition-colors w-full px-1 py-1 rounded-lg hover:bg-red-500/10">
          <LogOut size={15} />
          <span>تسجيل الخروج</span>
        </button>
      </div>

    </aside>
  );
}