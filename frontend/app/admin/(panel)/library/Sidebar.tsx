"use client";

import { useMemo } from "react";
import { LibraryAlbum, LibraryContext, FilterOption } from "./types";

interface SidebarProps {
  albums: LibraryAlbum[];
  activeContext: LibraryContext;
  onSelectFilter: (filter: FilterOption, year?: number | null) => void;
  onSelectAlbum: (albumId: number, label?: string) => void;
  loadingAlbums?: boolean;
  years?: number[];
}

function visibilityLabel(value?: number | string) {
  if (value === undefined || value === null) return "Public";
  const numeric = typeof value === "string" ? Number(value) : value;
  if (numeric === 2) return "Private";
  if (numeric === 1) return "Unlisted";
  return "Public";
}

export function Sidebar({
  albums,
  activeContext,
  onSelectAlbum,
  onSelectFilter,
  loadingAlbums,
  years = [],
}: SidebarProps) {
  const groupedAlbums = useMemo(() => {
    const groups = {
      featured: [] as LibraryAlbum[],
      public: [] as LibraryAlbum[],
      unlisted: [] as LibraryAlbum[],
      private: [] as LibraryAlbum[],
    };

    albums.forEach((album) => {
      const visibility = visibilityLabel(album.visibility);
      if (album.image_count && album.image_count > 30) {
        groups.featured.push(album);
      }
      if (visibility === "Public") groups.public.push(album);
      else if (visibility === "Unlisted") groups.unlisted.push(album);
      else groups.private.push(album);
    });

    return groups;
  }, [albums]);

  const isFilterActive = (filter: FilterOption, year?: number | null) => {
    return activeContext.filter === filter && (filter !== "year" || activeContext.year === year);
  };

  const baseButton =
    "w-full flex items-center justify-between px-2.5 py-2 rounded-[5px] text-[13px] text-[#a4a4a4] hover:bg-[rgba(255,255,255,0.04)] hover:text-white transition duration-125";

  const selectedClass =
    "bg-[rgba(255,255,255,0.08)] text-white border-l-[3px] border-l-[#c88b4b]";

  return (
    <aside className="bg-[#1c1c1c] border border-[rgba(255,255,255,0.05)] rounded-[6px] p-3 space-y-4 text-[13px] text-[#a4a4a4] h-full shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-[#6f6f6f]">
          <span>Content</span>
          <span className="h-px flex-1 ml-3 bg-[rgba(255,255,255,0.06)]" />
        </div>
        {["content", "lastImport", "favorites", "featured", "quick", "unlisted", "private"].map((key) => {
          const filter = key as FilterOption;
          const labelMap: Record<FilterOption, string> = {
            content: "All content",
            lastImport: "Last import",
            favorites: "Favorites",
            featured: "Featured",
            quick: "Quick collection",
            unlisted: "Unlisted",
            private: "Private",
            year: "",
          };
          const icons: Record<FilterOption, string> = {
            content: "◻",
            lastImport: "⏱",
            favorites: "★",
            featured: "◆",
            quick: "↯",
            unlisted: "⤴",
            private: "⌁",
            year: "⏳",
          };
          return (
            <button
              key={filter}
              onClick={() => onSelectFilter(filter)}
              className={`${baseButton} ${isFilterActive(filter) ? selectedClass : ""}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-[12px] text-[#6f6f6f]">{icons[filter]}</span>
                <span className="leading-tight">{labelMap[filter]}</span>
              </div>
              <span className="text-[10px] text-[#6f6f6f]">›</span>
            </button>
          );
        })}
      </div>

      <div className="pt-1 space-y-2">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-[#6f6f6f]">
          <span>Date published</span>
          <span className="h-px flex-1 ml-3 bg-[rgba(255,255,255,0.06)]" />
        </div>
        <div className="max-h-48 overflow-y-auto pr-1 space-y-1">
          {years.length === 0 && (
            <p className="text-[12px] text-[#6f6f6f]">Waiting for content timestamps…</p>
          )}
          {years.map((year) => (
            <button
              key={year}
              onClick={() => onSelectFilter("year", year)}
              className={`${baseButton} ${isFilterActive("year", year) ? selectedClass : ""}`}
            >
              <span className="flex items-center gap-3">
                <span className="text-[12px] text-[#6f6f6f]">⟲</span>
                <span className="leading-tight">{year}</span>
              </span>
              <span className="text-[10px] text-[#6f6f6f]">›</span>
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2 space-y-3">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-[#6f6f6f]">
          <span>Collections</span>
          <span className="h-px flex-1 ml-3 bg-[rgba(255,255,255,0.06)]" />
        </div>

        <CollectionGroup
          title="Featured albums"
          albums={groupedAlbums.featured}
          loading={loadingAlbums}
          activeContext={activeContext}
          onSelectAlbum={onSelectAlbum}
        />
        <CollectionGroup
          title="Public albums"
          albums={groupedAlbums.public}
          loading={loadingAlbums}
          activeContext={activeContext}
          onSelectAlbum={onSelectAlbum}
        />
        <CollectionGroup
          title="Unlisted albums"
          albums={groupedAlbums.unlisted}
          loading={loadingAlbums}
          activeContext={activeContext}
          onSelectAlbum={onSelectAlbum}
        />
        <CollectionGroup
          title="Private albums"
          albums={groupedAlbums.private}
          loading={loadingAlbums}
          activeContext={activeContext}
          onSelectAlbum={onSelectAlbum}
        />
      </div>
    </aside>
  );
}

interface CollectionGroupProps {
  title: string;
  albums: LibraryAlbum[];
  activeContext: LibraryContext;
  onSelectAlbum: (albumId: number, label?: string) => void;
  loading?: boolean;
}

function CollectionGroup({ title, albums, activeContext, onSelectAlbum, loading }: CollectionGroupProps) {
  if (loading && (!albums || albums.length === 0)) {
    return (
      <div className="space-y-1">
        <p className="text-xs text-neutral-500">Loading {title.toLowerCase()}…</p>
      </div>
    );
  }

  if (!albums || albums.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      <p className="text-[11px] uppercase tracking-[0.22em] text-[#6f6f6f]">{title}</p>
      {albums.map((album) => {
        const active = activeContext.scope === "album" && activeContext.albumId === Number(album.id);
        return (
          <button
            key={album.id}
            onClick={() => onSelectAlbum(Number(album.id), album.title ?? undefined)}
            className={`${
              active
                ? "bg-[rgba(255,255,255,0.08)] text-white border-l-[3px] border-l-[#c88b4b]"
                : "text-[#a4a4a4] hover:text-white border border-transparent hover:border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.04)]"
            } w-full rounded-[5px] px-3 py-2 flex items-center justify-between transition duration-125`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c88b4b]" />
              <span className="truncate text-left leading-tight">{album.title || "Untitled"}</span>
            </div>
            {album.image_count !== undefined && (
              <span className="text-[11px] text-[#6f6f6f]">{album.image_count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
