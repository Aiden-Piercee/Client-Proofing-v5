import React, { ReactNode } from "react";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return <div className="min-h-screen bg-[#1a1a1a] text-[#dddddd]">{children}</div>;
}
