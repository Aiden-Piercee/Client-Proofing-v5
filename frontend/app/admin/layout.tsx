import React, { ReactNode } from "react";
import AdminNav from "./components/AdminNav";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-10 lg:py-14 flex gap-8 lg:gap-12">
        <AdminNav />
        <main className="flex-1 space-y-8">{children}</main>
      </div>
    </div>
  );
}
