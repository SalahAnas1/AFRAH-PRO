"use client";
import DarkModeToggle from "@/components/DarkModeToggle";

interface TopbarProps {
  title: string;
  breadcrumb?: { label: string }[];
}

export default function Topbar({ title, breadcrumb }: TopbarProps) {
  return (
    <header className="h-auto min-h-[52px] sm:h-[60px] bg-cream-light border-b border-border flex items-center justify-between px-4 sm:px-6 py-3 sm:py-0 sticky top-0 z-30">

      {/* عنوان الصفحة والـ breadcrumb */}
      <div>
        {breadcrumb && (
          <div className="flex items-center gap-1.5 text-[11px] text-gray-text mb-0.5 flex-wrap">
            {breadcrumb.map((item, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span>/</span>}
                <span className={i === breadcrumb.length - 1 ? "text-gold font-medium" : ""}>
                  {item.label}
                </span>
              </span>
            ))}
          </div>
        )}
        <h2 className="text-base sm:text-[19px] font-bold text-dark">{title}</h2>
      </div>

      <DarkModeToggle compact={true} onDark={false} />

    </header>
  );
}