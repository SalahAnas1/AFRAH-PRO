"use client";
import { useEffect, useState } from "react";
import { ExternalLink, Megaphone } from "lucide-react";
import { advertisementsApi } from "@/lib/api";

const STORAGE_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api").replace("/api", "");

interface SmallAd {
  id: number;
  title: string;
  description: string | null;
  image: string | null;
  link: string | null;
}

export default function SidebarAdvertisement() {
  const [ad, setAd] = useState<SmallAd | null>(null);

  useEffect(() => {
    advertisementsApi.active()
      .then((res) => {
        if (res.data?.small) setAd(res.data.small);
      })
      .catch(() => {});
  }, []);

  if (!ad) return null;

  return (
    <div className="mx-2.5 mb-3">
      <div className="rounded-xl overflow-hidden border border-white/10 bg-white/5">

        <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-1.5">
          <Megaphone size={10} className="text-gold" />
          <span className="text-[9px] text-gold font-bold tracking-widest uppercase">إعلان</span>
        </div>

        {ad.image && (
          <div className="mx-3 mb-2 rounded-lg overflow-hidden" style={{ height: "88px" }}>
            <img
              src={`${STORAGE_URL}/storage/${ad.image}`}
              alt={ad.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="px-3 pb-3">
          <p className="text-white text-xs font-semibold leading-snug">{ad.title}</p>
          {ad.description && (
            <p className="text-white/40 text-[11px] mt-0.5 leading-relaxed line-clamp-2">
              {ad.description}
            </p>
          )}
          {ad.link && (
            <a
              href={ad.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-[11px] text-gold hover:text-gold-light transition-colors"
            >
              <ExternalLink size={11} />
              <span>عرض المزيد</span>
            </a>
          )}
        </div>

      </div>
    </div>
  );
}