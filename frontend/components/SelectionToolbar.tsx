import React from "react";
import { downloadZip } from "../lib/downloadZip";

interface SelectionToolbarProps {
  albumImages: string[];
  selectedImages: string[];
}

export default function SelectionToolbar({
  albumImages,
  selectedImages,
}: SelectionToolbarProps) {
  const hasSelection = selectedImages.length > 0;

  const handleDownloadSelected = async () => {
    await downloadZip(selectedImages, "selected");
  };

  const handleDownloadAll = async () => {
    await downloadZip(albumImages, "all");
  };

  const handleDownloadInstagram = async () => {
    await downloadZip(selectedImages, "instagram");
  };

  return (
    <div className="sticky top-6 z-20 mb-6">
      <div
        className={`max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-3 px-5 py-4 rounded-2xl border border-white/10 bg-black/70 backdrop-blur-md shadow-[0_18px_60px_rgba(0,0,0,0.35)] transition-all duration-300 ${hasSelection ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3 pointer-events-none"}`}
      >
        <button
          onClick={handleDownloadSelected}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-sm font-semibold tracking-wide shadow-inner shadow-white/30 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/40 active:translate-y-0"
        >
          <span>Download Selected</span>
        </button>

        <button
          onClick={handleDownloadAll}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 text-white text-sm font-medium tracking-wide border border-white/10 shadow-inner shadow-black/40 transition hover:-translate-y-0.5 hover:border-white/30 hover:shadow-lg hover:shadow-black/40 active:translate-y-0"
        >
          <span>Download All</span>
        </button>

        <button
          onClick={handleDownloadInstagram}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-pink-500 to-fuchsia-500 text-black text-sm font-semibold tracking-wide shadow-inner shadow-amber-800/30 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-pink-500/40 active:translate-y-0"
        >
          <span>Download for Instagram</span>
        </button>
      </div>
    </div>
  );
}
