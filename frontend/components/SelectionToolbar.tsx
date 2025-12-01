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
    <div className="sticky top-4 z-20 mb-4">
      <div
        className={`max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-3 px-4 py-3 rounded-2xl border border-white/10 bg-neutral-900/80 backdrop-blur shadow-[0_14px_45px_rgba(0,0,0,0.35)] transition-all duration-300 ${hasSelection ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3 pointer-events-none"}`}
      >
        <button
          onClick={handleDownloadSelected}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-black font-medium shadow-inner shadow-emerald-700/30 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/30 active:translate-y-0"
        >
          <span>Download Selected</span>
        </button>

        <button
          onClick={handleDownloadAll}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-800 text-white font-medium shadow-inner shadow-black/30 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30 active:translate-y-0"
        >
          <span>Download All</span>
        </button>

        <button
          onClick={handleDownloadInstagram}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-orange-400 text-white font-medium shadow-inner shadow-pink-700/30 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-pink-500/40 active:translate-y-0"
        >
          <span>Download for Instagram</span>
        </button>
      </div>
    </div>
  );
}
