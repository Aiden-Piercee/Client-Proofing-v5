"use client";

import { useMemo } from "react";
import { LibraryImage } from "./types";

interface ThumbnailGridProps {
  images: LibraryImage[];
  selectedId: number | null;
  onSelect: (imageId: number) => void;
  onDoubleClick?: (image: LibraryImage) => void;
  isLoading?: boolean;
  visibleCount: number;
  onLoadMore: () => void;
  columnEstimate: number;
}

function formatDate(timestamp?: number | string | null) {
  if (!timestamp && timestamp !== 0) return "";
  const numeric = typeof timestamp === "string" ? Number(timestamp) : timestamp;
  if (!numeric) return "";
  const date = new Date(numeric * 1000);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function ThumbnailGrid({
  images,
  selectedId,
  onSelect,
  onDoubleClick,
  isLoading,
  visibleCount,
  onLoadMore,
  columnEstimate,
}: ThumbnailGridProps) {
  const visibleImages = useMemo(() => images.slice(0, visibleCount), [images, visibleCount]);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-neutral-900/70 p-4 shadow-xl shadow-black/30 min-h-[520px]">
      {isLoading && (
        <p className="text-sm text-neutral-500">Loading content…</p>
      )}
      {!isLoading && images.length === 0 && (
        <p className="text-sm text-neutral-500">No media found for this context.</p>
      )}
      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: `repeat(auto-fill, minmax(${Math.max(160, Math.floor(1200 / Math.max(4, columnEstimate)))}px, 1fr))`,
        }}
      >
        {visibleImages.map((img) => {
          const selected = selectedId === img.id;
          return (
            <button
              key={img.id}
              onClick={() => onSelect(img.id)}
              onDoubleClick={() => onDoubleClick?.(img)}
              className={`group relative overflow-hidden rounded-lg border transition focus:outline-none ${
                selected
                  ? "border-amber-400 shadow-[0_0_0_2px_rgba(227,154,76,0.45)]"
                  : "border-white/10 hover:border-white/30"
              }`}
            >
              <div className="aspect-[4/3] bg-neutral-800">
                <img
                  src={img.medium || img.thumb || img.full || "/placeholder.svg"}
                  srcSet={`${img.medium || img.thumb || ""} 1x, ${img.large || img.medium || img.thumb || ""} 2x`}
                  alt={img.title || img.filename || `Image #${img.id}`}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02] group-hover:brightness-110"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition" />
              <div className="absolute left-0 right-0 bottom-0 px-3 py-2 flex items-center justify-between text-xs text-white">
                <span className="truncate" title={img.title || img.filename || undefined}>
                  {img.title || img.filename || `Image #${img.id}`}
                </span>
                {img.favorite ? (
                  <span className="text-amber-300">★</span>
                ) : img.hasEditedReplacement ? (
                  <span className="rounded-full bg-amber-500/70 px-2 py-0.5 text-[10px] uppercase">Edited</span>
                ) : null}
              </div>
              <div className="bg-neutral-900/90 text-[11px] text-neutral-300 py-2 text-center border-t border-white/5">
                {formatDate(img.captured_on || img.uploaded_on || img.modified_on)}
              </div>
            </button>
          );
        })}
      </div>
      {visibleImages.length < images.length && (
        <button
          onClick={onLoadMore}
          className="mx-auto mt-2 w-40 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10 transition"
        >
          Load more
        </button>
      )}
    </div>
  );
}
