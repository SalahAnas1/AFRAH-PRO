"use client";
import { useLanguage } from "@/context/LanguageContext";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import SuperAdminSidebar from "./Sidebar";
import { Menu, Crown } from "lucide-react";
import DarkModeToggle from "@/components/DarkModeToggle";

export default function SuperAdminLayoutShell({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <div className="min-h-screen bg-cream flex">
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <SuperAdminSidebar open={open} onClose={() => setOpen(false)} />

      <main className="flex-1 lg:ms-[210px] min-h-screen overflow-x-hidden">
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-navy sticky top-0 z-30 shadow-md">
          <button
            onClick={() => setOpen(true)}
            className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center"
            aria-label={t("superAdmin.openMenu")}
          >
            <Menu size={20} className="text-white" />
          </button>
          <div className="flex items-center gap-2">
            <Crown size={16} className="text-gold" />
            <span className="text-white font-bold text-sm">سوبر أدمن</span>
          </div>
          <DarkModeToggle />
        </div>

        {children}
      </main>
    </div>
  );
}