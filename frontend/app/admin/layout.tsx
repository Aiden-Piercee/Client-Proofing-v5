import React, { ReactNode } from "react";
import AdminNav from "./components/AdminNav";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen flex bg-neutral-100">
      <AdminNav />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
