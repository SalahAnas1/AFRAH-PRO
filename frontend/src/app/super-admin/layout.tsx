import SuperAdminLayoutShell from "@/components/super-admin/LayoutShell";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return <SuperAdminLayoutShell>{children}</SuperAdminLayoutShell>;
}