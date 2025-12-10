import React, { ReactNode } from "react";
import AdminHeader from "../components/AdminHeader";

interface AdminPanelLayoutProps {
  children: ReactNode;
}

export default function AdminPanelLayout({ children }: AdminPanelLayoutProps) {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-[#dddddd]">
      <AdminHeader />
      <main className="max-w-7xl mx-auto px-5 pb-12 pt-8 space-y-7">{children}</main>
    </div>
  );
}
