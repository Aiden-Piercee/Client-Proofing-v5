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
    <aside className="w-72 bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/30 sticky top-8 h-fit">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">Admin</p>
          <h1 className="text-2xl font-semibold text-white">ClientProofing</h1>
        </div>
        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(52,211,153,0.15)]" aria-hidden />
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-xl px-4 py-3 border transition ${
                active
                  ? "border-white/25 bg-white/10 text-white shadow-lg shadow-black/20"
                  : "border-white/5 text-neutral-300 hover:text-white hover:border-white/15 hover:bg-white/5"
              }`}
            >
              <span className="font-medium">{item.label}</span>
              <span
                className={`h-2 w-2 rounded-full ${active ? "bg-white" : "bg-white/30"}`}
                aria-hidden
              />
            </Link>
          );
        })}
      </nav>

      <div className="pt-6 mt-6 border-t border-white/10">
        <button
          onClick={logout}
          className="w-full bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-rose-900/40 hover:from-red-400 hover:to-rose-500 transition"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
