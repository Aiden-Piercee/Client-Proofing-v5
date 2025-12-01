"use client";

import React, { useState } from "react";
import { Image } from "@/lib/types";

interface Props {
  image: Image;
  onClick: () => void;
  onFavorite: (img: Image) => void;
  onApprove: (img: Image) => void;
  onReject: (img: Image) => void;
  onClear: (img: Image) => void;
  onPrint: (img: Image) => void; // NEW
}

export default function ImageCard({ image, onClick, onFavorite, onApprove, onReject, onClear, onPrint }: Props) {
  const [feedback, setFeedback] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 1500);
  };

  const best = image.small || image.medium || image.thumb;
  const best2x = image.full || image.large2x || image.medium2x || image.thumb2x;

  return (
    <div className="relative group cursor-pointer overflow-hidden rounded-lg bg-neutral-800 aspect-square shadow-md hover:shadow-lg transition">
      <img
        src={best}
        srcSet={`${best} 1x, ${best2x} 2x`}
        alt={image.title || ""}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        onClick={onClick}
      />

      {/* Toolbar */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">

        {/* Favorite */}
        <button onClick={(e) => { e.stopPropagation(); onFavorite(image); showFeedback("Marked as Favorite"); }} className="p-1 text-white/90 bg-black/40 hover:bg-black rounded">❤️</button>

        {/* Approve */}
        <button onClick={(e) => { e.stopPropagation(); onApprove(image); showFeedback("Marked as Approved"); }} className="p-1 text-white/90 bg-black/40 hover:bg-black rounded">✔️</button>

        {/* Reject */}
        <button onClick={(e) => { e.stopPropagation(); onReject(image); showFeedback("Marked as Rejected"); }} className="p-1 text-white/90 bg-black/40 hover:bg-black rounded">❌</button>

        {/* PRINT */}
        <button onClick={(e) => { e.stopPropagation(); onPrint(image); showFeedback(image.print ? "Print Removed" : "Marked for Print"); }} className="p-1 text-white/90 bg-black/40 hover:bg-black rounded">🖨️</button>

        {/* Clear */}
        <button onClick={(e) => { e.stopPropagation(); onClear(image); showFeedback("Status Cleared"); }} className="p-1 text-white/90 bg-black/40 hover:bg-black rounded">↺</button>
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
