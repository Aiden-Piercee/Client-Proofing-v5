"use client";

import React, { useState } from "react";
import { Image } from "@/lib/types";

interface Props {
  image: Image;
  selected?: boolean;
  onClick: (event: React.MouseEvent) => void;
  onToggleSelect: () => void;
  onFavorite: () => void;
  onApprove: () => void;
  onReject: () => void;
  onClear: () => void;
  onPrint: () => void; // NEW
  cardRef?: (node: HTMLDivElement | null) => void;
}

export default function ImageCard({
  image,
  selected = false,
  onClick,
  onToggleSelect,
  onFavorite,
  onApprove,
  onReject,
  onClear,
  onPrint,
  cardRef,
}: Props) {
  const [feedback, setFeedback] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 1500);
  };

  const best = image.small || image.medium || image.thumb;
  const best2x = image.full || image.large2x || image.medium2x || image.thumb2x;

  return (
    <div
      data-image-card
      className={`relative group cursor-pointer overflow-hidden rounded-lg bg-neutral-800 aspect-square transition shadow-md hover:shadow-lg ${selected ? "ring-2 ring-emerald-400 ring-offset-2 ring-offset-neutral-900" : ""}`}
      onClick={onClick}
      ref={cardRef}
    >
      <img
        src={best}
        srcSet={`${best} 1x, ${best2x} 2x`}
        alt={image.title || ""}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />

      {/* Selection toggle */}
      <div className="absolute top-2 left-2 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect();
            showFeedback(selected ? "Unselected" : "Selected");
          }}
          className={`h-9 w-9 rounded-full border border-white/10 flex items-center justify-center shadow-lg transition ${selected ? "bg-emerald-400 text-black" : "bg-black/50 text-white hover:bg-black/70"}`}
          aria-label={selected ? "Unselect image" : "Select image"}
        >
          {selected ? "✓" : "+"}
        </button>
      </div>

      {/* Toolbar */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">

        {/* Favorite */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavorite();
            showFeedback("Marked as Favorite");
          }}
          className="p-1 text-white/90 bg-black/40 hover:bg-black rounded"
        >
          ❤️
        </button>

        {/* Approve */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onApprove();
            showFeedback("Marked as Approved");
          }}
          className="p-1 text-white/90 bg-black/40 hover:bg-black rounded"
        >
          ✔️
        </button>

        {/* Reject */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReject();
            showFeedback("Marked as Rejected");
          }}
          className="p-1 text-white/90 bg-black/40 hover:bg-black rounded"
        >
          ❌
        </button>

        {/* PRINT */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrint();
            showFeedback(image.print ? "Print Removed" : "Marked for Print");
          }}
          className="p-1 text-white/90 bg-black/40 hover:bg-black rounded"
        >
          🖨️
        </button>

        {/* Clear */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClear();
            showFeedback("Status Cleared");
          }}
          className="p-1 text-white/90 bg-black/40 hover:bg-black rounded"
        >
          ↺
        </button>
      </div>

      {/* State tags */}
      <div className="absolute bottom-2 left-2 space-y-1">

        {image.state === "favorite" && (
          <div className="bg-black/60 text-xs px-2 py-1 rounded text-white">❤️ Favorite</div>
        )}

        {image.state === "approved" && (
          <div className="bg-black/60 text-xs px-2 py-1 rounded text-white">✔️ Approved</div>
        )}

        {image.state === "rejected" && (
          <div className="bg-black/60 text-xs px-2 py-1 rounded text-white">❌ Rejected</div>
        )}

        {/* PRINT TAG */}
        {image.print && (
          <div className="bg-yellow-600 text-xs px-2 py-1 rounded text-white">🖨️ Print</div>
        )}
      </div>

      {/* Feedback bubble */}
      {feedback && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-white text-black px-3 py-1.5 rounded-md shadow text-xs font-medium animate-fade">
          {feedback}
        </div>
      )}
    </div>
  );
}
