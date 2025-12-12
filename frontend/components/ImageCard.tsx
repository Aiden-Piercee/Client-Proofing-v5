"use client";

import React, { useState } from "react";
import { Image } from "@/lib/types";

interface Props {
  image: Image;
  onClick: () => void;
  onFavorite: () => void;
  onApprove: () => void;
  onReject: () => void;
  onClear: () => void;
  onPrint: () => void;
}

export default function ImageCard({
  image,
  onClick,
  onFavorite,
  onApprove,
  onReject,
  onClear,
  onPrint,
}: Props) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const isEdited = Boolean(
    image.isEditedReplacement || image.edited || image.hasEditedReplacement,
  );

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 1500);
  };

  const best = image.small || image.medium || image.thumb;
  const best2x = image.full || image.large2x || image.medium2x || image.thumb2x;

  return (
    <div
      data-image-card
      className={`relative group cursor-pointer overflow-hidden rounded-lg bg-neutral-800 transition shadow-md hover:shadow-lg ${
        isEdited ? 'ring-2 ring-emerald-400/70 shadow-emerald-500/30' : ''
      }`}
      onClick={onClick}
    >
      <img
        src={best}
        srcSet={`${best} 1x, ${best2x} 2x`}
        alt={image.title || ""}
        loading="lazy"
        className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-[1.02]"
      />

      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
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

        {image.print && (
          <div className="bg-yellow-600 text-xs px-2 py-1 rounded text-white">🖨️ Print</div>
        )}

        {isEdited && (
          <div className="inline-flex items-center gap-1 rounded bg-emerald-600/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white shadow">
            ✨ Edited
          </div>
        )}
      </div>

      {feedback && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-white text-black px-3 py-1.5 rounded-md shadow text-xs font-medium animate-fade">
          {feedback}
        </div>
      )}
    </div>
  );
}
