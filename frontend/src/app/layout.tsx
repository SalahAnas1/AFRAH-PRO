import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "AFRAH PRO",
  description: "نظام إدارة محلات الأفراح والمناسبات",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <head>
        {/* تطبيق اللغة المحفوظة قبل الرسم لمنع الوميض */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var l=localStorage.getItem('app_language');if(l==='fr'){document.documentElement.dir='ltr';document.documentElement.lang='fr';}}catch(e){}
try{if(localStorage.getItem('theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
      </head>
      <body className="font-sans bg-cream text-dark min-h-screen">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}