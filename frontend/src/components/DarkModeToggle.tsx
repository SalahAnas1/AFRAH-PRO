"use client";
import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";

interface Props {
  /** compact = أيقونة فقط | full = مع نص */
  compact?: boolean;
  /** على خلفية داكنة (sidebar / mobile header) أم فاتحة (topbar / dashboard) */
  onDark?: boolean;
}

export default function DarkModeToggle({ compact = true, onDark = true }: Props) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}
  };

  const iconColor = isDark
    ? "text-gold"
    : onDark
      ? "text-white/60"
      : "text-gray-500";

  const hoverBg = onDark
    ? "hover:bg-white/10"
    : "hover:bg-gray-100 dark:hover:bg-white/10";

  if (compact) {
    return (
      <button
        onClick={toggle}
        title={isDark ? "الوضع الفاتح" : "الوضع الداكن"}
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${hoverBg}`}
      >
        {isDark
          ? <Sun  size={18} className="text-gold" />
          : <Moon size={18} className={onDark ? "text-white/60" : "text-gray-500"} />
        }
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-2 text-sm transition-colors w-full px-1 py-1.5 rounded-lg ${
        onDark
          ? "text-white/50 hover:text-white/80 hover:bg-white/5"
          : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
      }`}
    >
      {isDark
        ? <Sun  size={15} className="text-gold" />
        : <Moon size={15} className={iconColor} />
      }
      <span>{isDark ? "الوضع الفاتح" : "الوضع الداكن"}</span>
    </button>
  );
}