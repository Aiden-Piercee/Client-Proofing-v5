"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/albums", label: "Albums" },
  { href: "/admin/clients", label: "Client List" },
  { href: "/admin/sessions", label: "Sessions" },
  { href: "/admin/token-management", label: "Token management" },
  { href: "/admin/housekeeping", label: "Housekeeping" },
];

export default function AdminNav() {
  const router = useRouter();
  const pathname = usePathname();

  const logout = () => {
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  };

  return (
    <aside className="w-72 bg-[#1c1c1c] border border-[rgba(255,255,255,0.05)] rounded-[6px] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.35)] sticky top-8 h-fit space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#6f6f6f]">Admin</p>
          <h1 className="text-[16px] font-semibold text-white">ClientProofing</h1>
        </div>
        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.12)]" aria-hidden />
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-[5px] px-3 py-2 border transition duration-125 text-[13px] ${
                active
                  ? "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.08)] text-white shadow-[inset_3px_0_0_0_#c88b4b]"
                  : "border-transparent text-[#a4a4a4] hover:text-white hover:border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.04)]"
              }`}
            >
              <span className="font-medium leading-tight">{item.label}</span>
              <span className={`h-2 w-2 rounded-full ${active ? "bg-[#c88b4b]" : "bg-white/30"}`} aria-hidden />
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 mt-4 border-t border-[rgba(255,255,255,0.05)]">
        <button
          onClick={logout}
          className="w-full bg-[#282222] text-white font-semibold py-2.5 rounded-[5px] border border-[rgba(255,255,255,0.08)] hover:bg-[#302a2a] transition duration-125"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
