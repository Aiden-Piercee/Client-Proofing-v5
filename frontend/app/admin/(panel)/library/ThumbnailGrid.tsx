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
    <div className="flex flex-col gap-3 rounded-[6px] border border-[rgba(255,255,255,0.05)] bg-[#202020] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.35)] min-h-[520px]">
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
              className={`group relative overflow-hidden rounded-[4px] border transition duration-125 focus:outline-none ${
                selected
                  ? "border-[#c88b4b] shadow-[0_0_0_2px_rgba(200,139,75,0.45)]"
                  : "border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.12)]"
              } ${selected ? "shadow-[0_4px_10px_rgba(0,0,0,0.35)]" : "hover:translate-y-[-2px] hover:shadow-[0_4px_8px_rgba(0,0,0,0.25)]"}`}
            >
              <div className="aspect-[4/3] bg-[#1a1a1a]">
                <img
                  src={img.medium || img.thumb || img.full || "/placeholder.svg"}
                  srcSet={`${img.medium || img.thumb || ""} 1x, ${img.large || img.medium || img.thumb || ""} 2x`}
                  alt={img.title || img.filename || `Image #${img.id}`}
                  className="h-full w-full object-cover transition duration-125 group-hover:scale-[1.01] group-hover:brightness-110"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition duration-125" />
              <div className="absolute left-0 right-0 bottom-0 px-3 py-2 flex items-center justify-between text-[12px] text-white">
                <span className="truncate leading-tight" title={img.title || img.filename || undefined}>
                  {img.title || img.filename || `Image #${img.id}`}
                </span>
                {img.favorite ? (
                  <span className="text-amber-300">★</span>
                ) : img.hasEditedReplacement ? (
                  <span className="rounded-[4px] border border-[rgba(255,255,255,0.08)] bg-[rgba(200,139,75,0.15)] px-2 py-0.5 text-[10px] uppercase text-[#f2d3a4]">
                    Edited
                  </span>
                ) : null}
              </div>
              <div className="bg-[#1a1a1a]/90 text-[11px] text-[#a4a4a4] py-2 text-center border-t border-[rgba(255,255,255,0.05)]">
                {formatDate(img.captured_on || img.uploaded_on || img.modified_on)}
              </div>
            </button>
          );
        })}
      </div>
      {visibleImages.length < images.length && (
        <button
          onClick={onLoadMore}
          className="mx-auto mt-2 w-40 rounded-[5px] border border-[rgba(255,255,255,0.08)] bg-[#1f1f1f] px-3 py-2 text-[13px] text-white hover:bg-[#232323] transition duration-125"
        >
          Load more
        </button>
      )}
    </div>
  );
}
