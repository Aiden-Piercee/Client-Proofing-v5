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
        ? "px-2.5 py-2 rounded-[5px] text-[13px] font-medium tracking-tight transition duration-125"
        : "px-2.5 py-1.5 rounded-[4px] text-[12px] font-medium tracking-tight transition duration-125";
    const activeStyles =
      variant === "primary"
        ? "bg-[#242424] text-white border border-[rgba(255,255,255,0.08)] shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
        : "bg-[#202020] text-white border border-[rgba(255,255,255,0.06)]";
    const inactiveStyles =
      variant === "primary"
        ? "text-[#a4a4a4] border border-transparent hover:text-white hover:border-[rgba(255,255,255,0.08)]"
        : "text-[#a4a4a4] border border-transparent hover:text-white hover:border-[rgba(255,255,255,0.08)]";

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
          <span className="px-2 py-0.5 rounded-[4px] text-[11px] bg-[#242424] text-white border border-[rgba(255,255,255,0.06)]">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[rgba(255,255,255,0.05)] bg-[#1c1c1c]/95 backdrop-blur-md shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
      <div className="max-w-7xl mx-auto px-5 py-3 space-y-3">
        <div className="flex items-center gap-3">
          <button
            aria-label="Toggle library navigation"
            className="h-9 w-9 rounded-[5px] border border-[rgba(255,255,255,0.08)] bg-[#202020] text-white flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
          >
            <span className="sr-only">Toggle navigation</span>
            <div className="space-y-1">
              <span className="block h-0.5 w-5 bg-white" />
              <span className="block h-0.5 w-5 bg-white/80" />
              <span className="block h-0.5 w-5 bg-white/60" />
            </div>
          </button>

          <div className="flex items-center gap-2.5 text-white">
            <div className="h-9 w-9 rounded-[6px] bg-[#c88b4b] flex items-center justify-center font-semibold tracking-tight text-black shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
              <span className="text-[13px]">KP</span>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#6f6f6f]">Koken-style</p>
              <h1 className="text-[15px] font-semibold leading-tight">Modern Library</h1>
            </div>
          </div>

          <div className="flex-1 flex flex-wrap gap-1.5">
            {primaryNav.map((item) => renderLink(item, "primary"))}
          </div>

          <div className="hidden lg:flex items-center gap-2.5">
            <input
              type="search"
              placeholder="Search library"
              className="h-9 w-52 rounded-[5px] bg-[#202020] border border-[rgba(255,255,255,0.08)] px-3 text-[13px] text-white placeholder:text-[#6f6f6f] focus:outline-none focus:ring-1 focus:ring-[rgba(200,139,75,0.55)]"
            />
            <button className="h-9 px-3 rounded-[5px] border border-[rgba(255,255,255,0.08)] text-[13px] text-white bg-[#222222] hover:bg-[#242424] transition duration-125">
              + Add album
            </button>
            <button className="h-9 px-3 rounded-[5px] border border-[rgba(255,255,255,0.08)] text-[13px] text-white bg-[#222222] hover:bg-[#242424] transition duration-125">
              Import...
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            {adminNav.map((item) => renderLink(item, "secondary"))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.18em] text-[#6f6f6f]">Status</span>
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.12)]" aria-hidden />
            <button
              onClick={logout}
              className="ml-3 h-9 px-4 rounded-[5px] bg-[#282222] text-[13px] font-semibold text-white border border-[rgba(255,255,255,0.08)] hover:bg-[#302a2a] transition duration-125"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
