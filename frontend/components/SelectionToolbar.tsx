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
        className={`max-w-5xl mx-auto w-full rounded-2xl border border-white/10 bg-black/70 backdrop-blur-md shadow-[0_18px_60px_rgba(0,0,0,0.35)] transition-all duration-300 ${hasSelection ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3 pointer-events-none"}`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-6 py-4">
          <div className="space-y-1 text-left">
            <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-neutral-300">Downloads</p>
            <p className="text-sm text-neutral-200/80 font-light">
              Export your chosen images in a format that matches the gallery quality.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-start md:justify-end gap-2">
            <button
              onClick={handleDownloadSelected}
              className="px-4 py-2 rounded-full bg-white text-black text-xs font-semibold tracking-[0.14em] uppercase shadow-inner shadow-white/40 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/50 active:translate-y-0"
            >
              Download Selected
            </button>

            <button
              onClick={handleDownloadAll}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 text-white text-xs font-semibold tracking-[0.14em] uppercase border border-white/10 shadow-inner shadow-black/40 transition hover:-translate-y-0.5 hover:border-white/30 hover:shadow-lg hover:shadow-black/50 active:translate-y-0"
            >
              Download All
            </button>

            <button
              onClick={handleDownloadInstagram}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-300 via-rose-400 to-fuchsia-500 text-black text-xs font-semibold tracking-[0.14em] uppercase shadow-inner shadow-amber-700/30 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-rose-500/50 active:translate-y-0"
            >
              Instagram Ready
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
