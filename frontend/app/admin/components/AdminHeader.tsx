"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";

interface NavItem {
  href: string;
  label: string;
  subtle?: boolean;
  badge?: string;
  disabled?: boolean;
}

const primaryNav: NavItem[] = [
  { href: "/admin/library", label: "Library" },
  { href: "/admin/text", label: "Text", disabled: true },
  { href: "/admin/albums", label: "Albums" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/drafts", label: "Drafts", disabled: true },
  { href: "/admin/hidden", label: "Hidden", disabled: true },
  { href: "/admin/system", label: "System", disabled: true },
];

const adminNav: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/sessions", label: "Sessions" },
  { href: "/admin/token-management", label: "Token mgmt" },
  { href: "/admin/housekeeping", label: "Housekeeping" },
];

export default function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  };

  const activeSegment = useMemo(() => {
    if (!pathname) return "";
    const parts = pathname.split("/").filter(Boolean);
    return parts.slice(0, 2).join("/");
  }, [pathname]);

  const renderLink = (item: NavItem, variant: "primary" | "secondary") => {
    const isActive = activeSegment === item.href.replace(/^\//, "");
    const base =
      variant === "primary"
        ? "px-3 py-2 rounded-lg text-sm font-semibold transition"
        : "px-3 py-2 rounded-md text-xs font-semibold transition";
    const activeStyles =
      variant === "primary"
        ? "bg-white/10 text-white shadow-lg shadow-black/30 border border-white/15"
        : "bg-white/5 text-white border border-white/10";
    const inactiveStyles =
      variant === "primary"
        ? "text-neutral-300 border border-transparent hover:border-white/10 hover:text-white"
        : "text-neutral-400 border border-transparent hover:border-white/10 hover:text-white";

    return (
      <Link
        key={item.href}
        href={item.disabled ? "#" : item.href}
        aria-disabled={item.disabled}
        className={`${base} ${isActive ? activeStyles : inactiveStyles} ${
          item.disabled ? "opacity-50 cursor-not-allowed" : ""
        } flex items-center gap-2`}
      >
        <span>{item.label}</span>
        {item.badge && (
          <span className="px-2 py-0.5 rounded-full text-[11px] bg-white/15 text-white border border-white/10">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-gradient-to-b from-neutral-950/80 via-neutral-950/70 to-neutral-950/50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 py-4 space-y-3">
        <div className="flex items-center gap-4">
          <button
            aria-label="Toggle library navigation"
            className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 text-white flex items-center justify-center shadow-lg shadow-black/30"
          >
            <span className="sr-only">Toggle navigation</span>
            <div className="space-y-1.5">
              <span className="block h-0.5 w-6 bg-white" />
              <span className="block h-0.5 w-6 bg-white/80" />
              <span className="block h-0.5 w-6 bg-white/60" />
            </div>
          </button>

          <div className="flex items-center gap-3 text-white">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-red-500 flex items-center justify-center font-black tracking-tighter shadow-lg shadow-amber-900/40">
              <span>KP</span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Koken-style</p>
              <h1 className="text-xl font-semibold">Modern Library</h1>
            </div>
          </div>

          <div className="flex-1 flex flex-wrap gap-2">
            {primaryNav.map((item) => renderLink(item, "primary"))}
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <input
              type="search"
              placeholder="Search library"
              className="h-10 w-52 rounded-lg bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
            <button className="h-10 px-3 rounded-lg border border-white/10 text-sm text-white bg-white/5 hover:bg-white/10 transition">
              + Add album
            </button>
            <button className="h-10 px-3 rounded-lg border border-white/10 text-sm text-white bg-white/5 hover:bg-white/10 transition">
              Import...
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {adminNav.map((item) => renderLink(item, "secondary"))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-neutral-400">Status</span>
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(52,211,153,0.15)]" aria-hidden />
            <button
              onClick={logout}
              className="ml-3 h-10 px-4 rounded-lg bg-gradient-to-r from-red-500 to-rose-600 text-sm font-semibold text-white shadow-lg shadow-rose-900/30 hover:from-red-400 hover:to-rose-500 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
