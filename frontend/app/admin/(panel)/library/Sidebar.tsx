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
    "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-neutral-300 hover:bg-white/5 hover:text-white transition";

  const selectedClass =
    "bg-white/10 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)] shadow-amber-500/20";

  return (
    <aside className="bg-neutral-900/60 border border-white/5 rounded-2xl p-4 space-y-4 text-sm text-neutral-300 h-full shadow-inner shadow-black/40">
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-neutral-500">
          <span>Content</span>
          <span className="h-px flex-1 ml-3 bg-white/5" />
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
                <span className="text-neutral-500">{icons[filter]}</span>
                <span>{labelMap[filter]}</span>
              </div>
              <span className="text-[10px] text-neutral-500">›</span>
            </button>
          );
        })}
      </div>

      <div className="pt-1 space-y-2">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-neutral-500">
          <span>Date published</span>
          <span className="h-px flex-1 ml-3 bg-white/5" />
        </div>
        <div className="max-h-48 overflow-y-auto pr-1 space-y-1">
          {years.length === 0 && (
            <p className="text-xs text-neutral-500">Waiting for content timestamps…</p>
          )}
          {years.map((year) => (
            <button
              key={year}
              onClick={() => onSelectFilter("year", year)}
              className={`${baseButton} ${isFilterActive("year", year) ? selectedClass : ""}`}
            >
              <span className="flex items-center gap-3">
                <span className="text-neutral-500">⟲</span>
                <span>{year}</span>
              </span>
              <span className="text-[10px] text-neutral-500">›</span>
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2 space-y-3">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-neutral-500">
          <span>Collections</span>
          <span className="h-px flex-1 ml-3 bg-white/5" />
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
      <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">{title}</p>
      {albums.map((album) => {
        const active = activeContext.scope === "album" && activeContext.albumId === Number(album.id);
        return (
          <button
            key={album.id}
            onClick={() => onSelectAlbum(Number(album.id), album.title ?? undefined)}
            className={`${
              active
                ? "bg-white/10 text-white border border-white/10"
                : "text-neutral-300 hover:text-white border border-transparent hover:border-white/10"
            } w-full rounded-lg px-3 py-2 flex items-center justify-between transition`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_0_6px_rgba(227,154,76,0.15)]" />
              <span className="truncate text-left">{album.title || "Untitled"}</span>
            </div>
            {album.image_count !== undefined && (
              <span className="text-[11px] text-neutral-500">{album.image_count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
