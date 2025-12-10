import React, { ReactNode } from "react";
import AdminHeader from "../components/AdminHeader";

interface AdminPanelLayoutProps {
  children: ReactNode;
}

export default function AdminPanelLayout({ children }: AdminPanelLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-white">
      <AdminHeader />
      <main className="max-w-7xl mx-auto px-6 pb-12 pt-8 space-y-8">{children}</main>
    </div>
  );
}
