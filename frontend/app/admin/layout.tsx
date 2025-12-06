import React, { ReactNode } from "react";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-black text-white">{children}</div>;
}
