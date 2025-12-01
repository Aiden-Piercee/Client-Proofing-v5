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
    <div className="flex gap-3 p-3 border-b bg-white">
      <button
        onClick={handleDownloadSelected}
        className="px-3 py-1 bg-black text-white rounded"
      >
        Download Selected
      </button>

      <button
        onClick={handleDownloadAll}
        className="px-3 py-1 bg-neutral-700 text-white rounded"
      >
        Download All
      </button>

      <button
        onClick={handleDownloadInstagram}
        className="px-3 py-1 bg-[#E1306C] text-white rounded"
      >
        Download for Instagram
      </button>
    </div>
  );
}
