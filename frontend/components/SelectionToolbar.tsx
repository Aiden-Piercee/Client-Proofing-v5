import React, { useEffect, useMemo, useState } from "react";
import { downloadZip } from "../lib/downloadZip";

interface SelectionToolbarProps {
  albumImages: string[];
  selectedImages: string[];
  onSelectAll?: () => void;
  onClearAll?: () => void;
}

export default function SelectionToolbar({
  albumImages,
  selectedImages,
  onSelectAll,
  onClearAll,
}: SelectionToolbarProps) {
  const hasSelection = selectedImages.length > 0;
  const [collapsed, setCollapsed] = useState(false);
  const isVisible = hasSelection && !collapsed;

  const handleDownloadSelected = async () => {
    await downloadZip(selectedImages, "selected");
  };

  const handleDownloadAll = async () => {
    await downloadZip(albumImages, "all");
  };

  const handleDownloadInstagram = async () => {
    await downloadZip(selectedImages, "instagram");
  };

  const selectionLabel = useMemo(
    () => `${selectedImages.length} selected`,
    [selectedImages.length]
  );

  const emit = (name: string) => {
    window.dispatchEvent(new Event(name));
  };

  const handleSelectAll = () => {
    onSelectAll?.();
    emit("selection:selectAll");
  };

  const handleClearAll = () => {
    onClearAll?.();
    emit("selection:clearAll");
  };

  const handleApprove = () => emit("selection:approve");
  const handleReject = () => emit("selection:reject");
  const handleDownloadShortcut = () => emit("selection:download");

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("selection:toolbar-visibility", { detail: isVisible }));
    return () => {
      window.dispatchEvent(new CustomEvent("selection:toolbar-visibility", { detail: false }));
    };
  }, [isVisible]);

  return (
    <>
      <div
        className={`pointer-events-none fixed left-1/2 bottom-4 z-30 flex w-full max-w-5xl -translate-x-1/2 justify-center transition-all duration-200 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0"
        }`}
        aria-live="polite"
      >
        <div className="pointer-events-auto flex flex-wrap items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-lg ring-1 ring-neutral-200">
          <div className="flex items-center gap-3 text-sm font-medium text-neutral-700">
            <span>{selectionLabel}</span>
            <button
              onClick={() => setCollapsed(true)}
              className="rounded-full bg-neutral-100 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-200"
            >
              Hide
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1 rounded bg-neutral-800 text-white hover:bg-neutral-700 transition"
            >
              Select All
            </button>

            <button
              onClick={handleClearAll}
              className="px-3 py-1 rounded bg-neutral-100 text-neutral-800 hover:bg-neutral-200 transition"
            >
              Clear
            </button>

            <button
              onClick={handleApprove}
              className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-500 transition"
            >
              Approve
            </button>

            <button
              onClick={handleReject}
              className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-500 transition"
            >
              Reject
            </button>

            <button
              onClick={handleDownloadSelected}
              className="px-3 py-1 rounded bg-blue-700 text-white hover:bg-blue-600 transition"
            >
              Download Selected
            </button>

            <button
              onClick={handleDownloadShortcut}
              className="px-3 py-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 transition"
            >
              Quick Download
            </button>

            <button
              onClick={handleDownloadInstagram}
              className="px-3 py-1 bg-[#E1306C] text-white rounded hover:brightness-110 transition"
            >
              Instagram
            </button>

            <button
              onClick={handleDownloadAll}
              className="px-3 py-1 bg-neutral-700 text-white rounded hover:bg-neutral-600 transition"
            >
              Download All
            </button>
          </div>
        </div>
      </div>

      {collapsed && hasSelection && (
        <button
          onClick={() => setCollapsed(false)}
          className="fixed bottom-4 right-4 z-30 rounded-full bg-neutral-900 px-4 py-2 text-white shadow-lg hover:bg-neutral-800"
        >
          Show Toolbar
        </button>
      )}
    </>
  );
}
