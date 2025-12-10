"use client";

import { ChangeEvent } from "react";
import { LibraryContext } from "./types";
import { contextLabel } from "./kokenClient";

interface ToolbarProps {
  context: LibraryContext;
  total: number;
  search: string;
  sort: string;
  onSearchChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onRefresh?: () => void;
}

export function Toolbar({
  context,
  total,
  search,
  sort,
  onSearchChange,
  onSortChange,
  onRefresh,
}: ToolbarProps) {
  const handleSort = (event: ChangeEvent<HTMLSelectElement>) => {
    onSortChange(event.target.value);
  };

  return (
    <div className="flex flex-col gap-3 rounded-[6px] border border-[rgba(255,255,255,0.05)] bg-[#202020] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
      <div className="flex flex-wrap items-start gap-3 justify-between">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#6f6f6f]">{contextLabel(context)}</p>
          <div className="flex items-center gap-2.5 text-white">
            <h2 className="text-[15px] font-semibold leading-tight">Koken Library overview</h2>
            <span className="rounded-[4px] bg-[#1a1a1a] px-3 py-1 text-[12px] text-[#a4a4a4] border border-[rgba(255,255,255,0.05)]">{total} items</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[13px] text-white">
          {[
            { label: "Edit", icon: "✎" },
            { label: "Filter", icon: "⚲" },
            { label: "Share", icon: "⇪" },
          ].map((action) => (
            <button
              key={action.label}
              className="flex items-center gap-2 rounded-[5px] border border-[rgba(255,255,255,0.08)] bg-[#1f1f1f] px-3 py-2 text-[13px] font-medium text-white hover:bg-[#232323] transition duration-125"
            >
              <span className="text-[#6f6f6f] text-[12px]">{action.icon}</span>
              <span className="leading-tight">{action.label}</span>
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search library"
              className="h-9 w-56 rounded-[5px] border border-[rgba(255,255,255,0.08)] bg-[#1a1a1a] px-3 text-[13px] text-white placeholder:text-[#6f6f6f] focus:outline-none focus:ring-1 focus:ring-[rgba(200,139,75,0.55)]"
            />
            <button
              onClick={onRefresh}
              className="h-9 rounded-[5px] border border-[rgba(255,255,255,0.08)] bg-[#1f1f1f] px-3 text-[13px] font-medium text-white hover:bg-[#232323] transition duration-125"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(255,255,255,0.05)] pt-3 text-[13px] text-[#a4a4a4]">
        <div className="flex items-center gap-2.5">
          <span className="rounded-[4px] bg-[#1f1f1f] px-3 py-1 text-[12px] font-semibold text-white border border-[rgba(255,255,255,0.08)] shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
            Grid view
          </span>
          <span className="rounded-[4px] bg-[#1f1f1f] px-3 py-1 text-[12px] text-[#a4a4a4] border border-[rgba(255,255,255,0.08)]">
            List
          </span>
          <span className="rounded-[4px] bg-[#1f1f1f] px-3 py-1 text-[12px] text-[#a4a4a4] border border-[rgba(255,255,255,0.08)]">
            Detail
          </span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[11px] uppercase tracking-[0.18em] text-[#6f6f6f]">Sort by</label>
          <select
            value={sort}
            onChange={handleSort}
            className="h-9 rounded-[5px] border border-[rgba(255,255,255,0.08)] bg-[#1a1a1a] px-3 text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-[rgba(200,139,75,0.55)]"
          >
            <option value="captured-desc">Date (newest)</option>
            <option value="captured-asc">Date (oldest)</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="id-desc">ID (high-low)</option>
            <option value="id-asc">ID (low-high)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
