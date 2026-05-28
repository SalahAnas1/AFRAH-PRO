"use client";
import { useEffect, useState } from "react";
import { ExternalLink, X } from "lucide-react";
import { advertisementsApi } from "@/lib/api";

const STORAGE_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api").replace("/api", "");

interface LargeAd {
  id: number;
  title: string;
  description: string | null;
  image: string | null;
  link: string | null;
}

export default function LargeAdBanner() {
  const [ad,        setAd]        = useState<LargeAd | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    advertisementsApi.active()
      .then((res) => {
        if (res.data?.large) setAd(res.data.large);
      })
      .catch(() => {});
  }, []);

  if (!ad || dismissed) return null;

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-sm border border-gold/20">

      {ad.image ? (
        /* ── مع صورة: Banner بالتدرج ── */
        <div className="relative w-full" style={{ height: "140px" }}>
          <img
            src={`${STORAGE_URL}/storage/${ad.image}`}
            alt={ad.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-black/70 via-black/30 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-end px-5 sm:px-8">
            <div className="text-right max-w-[60%] sm:max-w-sm">
              <p className="text-white font-bold text-base sm:text-lg leading-tight drop-shadow">
                {ad.title}
              </p>
              {ad.description && (
                <p className="text-white/80 text-xs sm:text-sm mt-1 leading-relaxed line-clamp-2 drop-shadow">
                  {ad.description}
                </p>
              )}
              {ad.link && (
                <a
                  href={ad.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2.5 inline-flex items-center gap-1.5 bg-gold text-navy text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-gold-light transition-colors"
                >
                  <ExternalLink size={12} />
                  عرض المزيد
                </a>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ── بدون صورة: Banner لوني ── */
        <div className="bg-gradient-to-l from-navy to-navy-light px-5 sm:px-8 py-5 flex items-center justify-between gap-4">
          <div className="text-right flex-1 min-w-0">
            <p className="text-white font-bold text-base leading-tight">{ad.title}</p>
            {ad.description && (
              <p className="text-white/60 text-sm mt-0.5 leading-relaxed line-clamp-2">{ad.description}</p>
            )}
          </div>
          {ad.link && (
            <a
              href={ad.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-gold text-navy text-xs font-bold px-4 py-2 rounded-lg hover:bg-gold-light transition-colors shrink-0"
            >
              <ExternalLink size={12} />
              عرض المزيد
            </a>
          )}
        </div>
      )}

      {/* زر الإغلاق */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 left-2 w-7 h-7 rounded-lg bg-black/30 hover:bg-black/50 flex items-center justify-center transition-colors"
        title="إغلاق الإعلان"
        aria-label="إغلاق الإعلان"
      >
        <X size={13} className="text-white" />
      </button>

    </div>
  );
}