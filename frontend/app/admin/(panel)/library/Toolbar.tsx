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
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-neutral-900/70 p-4 shadow-lg shadow-black/30">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="space-y-0.5">
          <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">{contextLabel(context)}</p>
          <div className="flex items-center gap-3 text-white">
            <h2 className="text-xl font-semibold leading-tight">Koken Library overview</h2>
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-neutral-300 border border-white/10">{total} items</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-white">
          {[
            { label: "Edit", icon: "✎" },
            { label: "Filter", icon: "⚲" },
            { label: "Share", icon: "⇪" },
          ].map((action) => (
            <button
              key={action.label}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white hover:bg-white/10 transition"
            >
              <span className="text-neutral-400">{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search library"
              className="h-10 w-56 rounded-lg border border-white/10 bg-neutral-800 px-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
            <button
              onClick={onRefresh}
              className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm font-medium text-white hover:bg-white/10 transition"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-3 text-sm text-neutral-300">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-amber-500/30 px-3 py-1 text-xs font-semibold text-amber-200 border border-amber-500/40 shadow-inner shadow-amber-900/40">
            Grid view
          </span>
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-neutral-400 border border-white/10">List</span>
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-neutral-400 border border-white/10">Detail</span>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs uppercase tracking-[0.2em] text-neutral-500">Sort by</label>
          <select
            value={sort}
            onChange={handleSort}
            className="h-9 rounded-md border border-white/10 bg-neutral-800 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
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
