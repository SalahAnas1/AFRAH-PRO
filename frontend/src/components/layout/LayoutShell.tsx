"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import { Menu, Crown } from "lucide-react";
import DarkModeToggle from "@/components/DarkModeToggle";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
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

      <Sidebar open={open} onClose={() => setOpen(false)} />

      <main className="flex-1 lg:mr-[210px] min-h-screen overflow-x-hidden">
        {/* شريط الهاتف العلوي مع زر القائمة */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-navy sticky top-0 z-30 shadow-md">
          <button
            onClick={() => setOpen(true)}
            className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center"
            aria-label="فتح القائمة"
          >
            <Menu size={20} className="text-white" />
          </button>
          <div className="flex items-center gap-2">
            <Crown size={16} className="text-gold" />
            <span className="text-white font-bold text-sm">AFRAH PRO</span>
          </div>
          <DarkModeToggle />
        </div>

        {children}
      </main>
    </div>
  );
}