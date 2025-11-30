"use client";

import React, { forwardRef, useState } from "react";
import { Image } from "@/lib/types";

interface Props {
  image: Image;
  selected: boolean;
  onClick: (event: React.MouseEvent) => void;
  onOpen: () => void;
  onFavorite: (img: Image) => void;
  onApprove: (img: Image) => void;
  onReject: (img: Image) => void;
  onClear: (img: Image) => void;
  onPrint: (img: Image) => void; // NEW
}

const ImageCard = forwardRef<HTMLDivElement, Props>(
  ({ image, selected, onClick, onOpen, onFavorite, onApprove, onReject, onClear, onPrint }, ref) => {
    const [feedback, setFeedback] = useState<string | null>(null);

    const showFeedback = (msg: string) => {
      setFeedback(msg);
      setTimeout(() => setFeedback(null), 1500);
    };

    const best = image.small || image.medium || image.thumb;
    const best2x = image.full || image.large2x || image.medium2x || image.thumb2x;

    return (
      <div
        ref={ref}
        className={`relative group cursor-pointer overflow-hidden rounded-lg bg-neutral-800 aspect-square shadow-md hover:shadow-lg transition ${
          selected ? "ring-2 ring-blue-400 ring-offset-2 ring-offset-neutral-900" : ""
        }`}
        onClick={onClick}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
      >
        <img
          src={best}
          srcSet={`${best} 1x, ${best2x} 2x`}
          alt={image.title || ""}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {selected && (
          <div className="absolute inset-0 bg-blue-500/10" aria-hidden>
            <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full shadow">Selected</div>
          </div>
        )}

        {/* Toolbar */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
          {/* Favorite */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFavorite(image);
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
              onApprove(image);
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
              onReject(image);
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
              onPrint(image);
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
              onClear(image);
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

        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          className="absolute bottom-2 right-2 bg-white/90 text-black text-xs px-2 py-1 rounded shadow hover:bg-white"
        >
          Open
        </button>

        {/* Feedback bubble */}
        {feedback && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-white text-black px-3 py-1.5 rounded-md shadow text-xs font-medium animate-fade">
            {feedback}
          </div>
        )}
      </div>
    );
  }
);

ImageCard.displayName = "ImageCard";

export default ImageCard;
