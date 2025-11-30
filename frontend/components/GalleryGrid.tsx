"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image } from "@/lib/types";
import { getAlbumImages, sendSelection } from "@/lib/api";
import ImageCard from "./ImageCard";
import Lightbox from "./Lightbox";

interface Props {
  albumId: number;
  sessionToken: string;
  sessionEmail?: string | null;

  selectedImages: string[];
  onSelectionChange: (imgs: string[]) => void;
}

export default function GalleryGrid({
  albumId,
  sessionToken,
  sessionEmail,
  selectedImages,
  onSelectionChange,
}: Props) {
  // Local state
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uiSelection, setUiSelection] = useState<string[]>(selectedImages);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [marqueeStart, setMarqueeStart] = useState<{ x: number; y: number } | null>(null);
  const [marqueeEnd, setMarqueeEnd] = useState<{ x: number; y: number } | null>(null);
  const [marqueeActive, setMarqueeActive] = useState(false);
  const [marqueeHits, setMarqueeHits] = useState<Set<string>>(new Set());
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);

  // Load album images
  useEffect(() => {
    async function load() {
      try {
        setError(null);
        const imgs = await getAlbumImages(albumId, sessionToken);
        setImages(imgs);
        updateSelection(imgs);
      } catch (err: any) {
        setError(err?.message ?? "Unable to load images");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [albumId, sessionToken]);

  // Cache email for UX
  useEffect(() => {
    if (sessionEmail) {
      localStorage.setItem("clientproofing:email", sessionEmail);
    }
  }, [sessionEmail]);

  // Build correct download URLs
  const makeDownloadURL = (img: Image): string => {
    let path = img.storage_path || "";
    let filename = img.filename || "";

    path = path.replace(/^\/+/, "");

    const alreadyContainsFile = path.endsWith(filename);
    const fullPath = alreadyContainsFile ? path : `${path}/${filename}`;

    return `http://clients.chasing.media/dl.php?src=/storage/originals/${fullPath}`;
  };

  // Sync parent-controlled selection into local UI state
  useEffect(() => {
    setUiSelection(selectedImages);
  }, [selectedImages]);

  // Update selection (only favorite + approved)
  const updateSelection = (updatedImages: Image[]) => {
    const selected = updatedImages
      .filter((img) => img.state === "favorite" || img.state === "approved")
      .map((img) => makeDownloadURL(img));

    setUiSelection(selected);
    onSelectionChange(selected);
  };

  const commitSelection = useCallback(
    (next: Set<string>) => {
      const arr = Array.from(next);
      setUiSelection(arr);
      onSelectionChange(arr);
    },
    [onSelectionChange]
  );

  const urlLookup = useMemo(() => {
    const map = new Map<string, Image>();
    images.forEach((img) => {
      map.set(makeDownloadURL(img), img);
    });
    return map;
  }, [images]);

  // Update image STATE
  const mark = async (
    id: number,
    state: "favorite" | "approved" | "rejected" | null
  ) => {
    const updated = images.map((img) =>
      img.id === id
        ? {
            ...img,
            state,
            // Reject clears print
            print: state === "rejected" ? false : img.print,
          }
        : img
    );

    setImages(updated);
    updateSelection(updated);

    await sendSelection({ sessionToken, imageId: id, state });
  };

  // Clear all flags on image (state + print)
  const clearAll = async (id: number) => {
    const updated = images.map((img) =>
      img.id === id
        ? {
            ...img,
            state: null,
            print: false, // CLEAR PRINT ✔
          }
        : img
    );

    setImages(updated);
    updateSelection(updated);

    await sendSelection({ sessionToken, imageId: id, state: null, print: false });
  };

  // Toggle print
  const togglePrint = async (id: number) => {
    const original = images.find((i) => i.id === id);
    if (!original) return;

    if (original.state === "rejected") return;

    const updated = images.map((img) =>
      img.id === id ? { ...img, print: !img.print } : img
    );

    setImages(updated);

    await sendSelection({
      sessionToken,
      imageId: id,
      print: !original.print,
    });
  };

  // Lightbox controls
  const open = (index: number) => setCurrentIndex(index);
  const close = () => setCurrentIndex(null);
  const prev = () => setCurrentIndex((i) => (i! > 0 ? i! - 1 : images.length - 1));
  const next = () => setCurrentIndex((i) => (i! < images.length - 1 ? i! + 1 : 0));

  // Selection helpers
  const toggleSelection = useCallback(
    (index: number, useRange: boolean) => {
      const target = images[index];
      if (!target) return;
      const url = makeDownloadURL(target);
      const next = new Set(uiSelection);

      if (useRange && lastSelectedIndex !== null) {
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        for (let i = start; i <= end; i++) {
          const inRangeUrl = makeDownloadURL(images[i]);
          next.add(inRangeUrl);
        }
      } else if (next.has(url)) {
        next.delete(url);
      } else {
        next.add(url);
      }

      setLastSelectedIndex(index);
      commitSelection(next);
    },
    [images, uiSelection, lastSelectedIndex, commitSelection]
  );

  const selectAll = useCallback(() => {
    const next = new Set<string>();
    images.forEach((img) => next.add(makeDownloadURL(img)));
    commitSelection(next);
  }, [images, commitSelection]);

  const clearSelection = useCallback(() => {
    commitSelection(new Set());
    setLastSelectedIndex(null);
  }, [commitSelection]);

  const applyBulkState = useCallback(
    async (state: "favorite" | "approved" | "rejected" | null) => {
      const ids = Array.from(uiSelection)
        .map((url) => urlLookup.get(url))
        .filter(Boolean)
        .map((img) => (img as Image).id);

      if (!ids.length) return;

      const updated = images.map((img) =>
        ids.includes(img.id)
          ? {
              ...img,
              state,
              print: state === "rejected" ? false : img.print,
            }
          : img
      );

      setImages(updated);
      updateSelection(updated);

      for (const id of ids) {
        await sendSelection({ sessionToken, imageId: id, state });
      }
    },
    [images, sessionToken, uiSelection, urlLookup]
  );

  const handleBulkDownload = useCallback(async () => {
    const { downloadZip } = await import("../lib/downloadZip");
    await downloadZip(uiSelection, "selected");
  }, [uiSelection]);

  // Custom events from toolbar shortcuts
  useEffect(() => {
    const handleSelectAll = () => selectAll();
    const handleClearAll = () => clearSelection();
    const handleApprove = () => applyBulkState("approved");
    const handleReject = () => applyBulkState("rejected");
    const handleDownload = () => handleBulkDownload();

    window.addEventListener("selection:selectAll", handleSelectAll);
    window.addEventListener("selection:clearAll", handleClearAll);
    window.addEventListener("selection:approve", handleApprove);
    window.addEventListener("selection:reject", handleReject);
    window.addEventListener("selection:download", handleDownload);

    return () => {
      window.removeEventListener("selection:selectAll", handleSelectAll);
      window.removeEventListener("selection:clearAll", handleClearAll);
      window.removeEventListener("selection:approve", handleApprove);
      window.removeEventListener("selection:reject", handleReject);
      window.removeEventListener("selection:download", handleDownload);
    };
  }, [selectAll, clearSelection, applyBulkState, handleBulkDownload]);

  // Marquee selection logic
  const updateMarqueeHits = useCallback(
    (rect: DOMRect) => {
      const hits = new Set<string>();
      imageRefs.current.forEach((node, index) => {
        if (!node) return;
        const box = node.getBoundingClientRect();
        const overlap =
          rect.left < box.right &&
          rect.right > box.left &&
          rect.top < box.bottom &&
          rect.bottom > box.top;
        if (overlap) {
          hits.add(makeDownloadURL(images[index]));
        }
      });
      setMarqueeHits(hits);
    },
    [images]
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!marqueeStart) return;

      const nextPoint = { x: event.clientX, y: event.clientY };
      setMarqueeEnd(nextPoint);

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const startX = marqueeStart.x;
        const startY = marqueeStart.y;
        const endX = nextPoint.x;
        const endY = nextPoint.y;

        const left = Math.min(startX, endX);
        const top = Math.min(startY, endY);
        const width = Math.abs(startX - endX);
        const height = Math.abs(startY - endY);
        const rect = new DOMRect(left, top, width, height);
        updateMarqueeHits(rect);
      });
    },
    [marqueeStart, updateMarqueeHits]
  );

  const endMarquee = useCallback(() => {
    if (marqueeHits.size) {
      const next = new Set(uiSelection);
      marqueeHits.forEach((id) => next.add(id));
      commitSelection(next);
    }

    setMarqueeStart(null);
    setMarqueeEnd(null);
    setMarqueeActive(false);
    setMarqueeHits(new Set());

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, [commitSelection, marqueeHits, uiSelection]);

  const handleMouseUp = useCallback(() => {
    if (marqueeActive) {
      endMarquee();
    }
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }, [endMarquee, handleMouseMove, marqueeActive]);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      if (event.target instanceof HTMLElement && event.target.closest("button")) return;

      setMarqueeActive(true);
      const point = { x: event.clientX, y: event.clientY };
      setMarqueeStart(point);
      setMarqueeEnd(point);
      updateMarqueeHits(new DOMRect(point.x, point.y, 0, 0));

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [handleMouseMove, handleMouseUp, updateMarqueeHits]
  );

  const showBubble = uiSelection.length > 3 && !marqueeActive;
  useEffect(() => {
    const handleToolbarVisibility = (event: Event) => {
      const detail = (event as CustomEvent<boolean>).detail;
      setToolbarVisible(Boolean(detail));
    };

    window.addEventListener("selection:toolbar-visibility", handleToolbarVisibility);
    return () => {
      window.removeEventListener("selection:toolbar-visibility", handleToolbarVisibility);
    };
  }, []);

  const showQuickBubble = showBubble && !toolbarVisible;

  const marqueeStyles = useMemo(() => {
    if (!marqueeStart || !marqueeEnd) return null;
    const left = Math.min(marqueeStart.x, marqueeEnd.x);
    const top = Math.min(marqueeStart.y, marqueeEnd.y);
    const width = Math.abs(marqueeStart.x - marqueeEnd.x);
    const height = Math.abs(marqueeStart.y - marqueeEnd.y);
    return { left, top, width, height };
  }, [marqueeStart, marqueeEnd]);

  const isSelected = useCallback(
    (url: string) => uiSelection.includes(url) || marqueeHits.has(url),
    [uiSelection, marqueeHits]
  );

  // Loading / error
  if (loading)
    return <div className="text-neutral-400 w-full text-center py-10">Loading...</div>;

  if (error)
    return <div className="text-red-400 w-full text-center py-10">{error}</div>;

  // Render
  return (
    <div className="relative" onMouseDown={handleMouseDown}>
      {/* Thumbnails */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-2">
        {images.map((img, index) => {
          const url = makeDownloadURL(img);
          return (
            <ImageCard
              ref={(node) => {
  imageRefs.current[index] = node;
}}

              key={img.id}
              image={img}
              selected={isSelected(url)}
              onClick={(e) => {
                e.preventDefault();
                toggleSelection(index, e.shiftKey);
              }}
              onOpen={() => open(index)}
              onFavorite={() => mark(img.id, "favorite")}
              onApprove={() => mark(img.id, "approved")}
              onReject={() => mark(img.id, "rejected")}
              onClear={() => clearAll(img.id)}
              onPrint={() => togglePrint(img.id)}
            />
          );
        })}
      </div>

      {/* Marquee */}
      {marqueeStyles && (
        <div
          className="absolute border border-blue-500/70 bg-blue-500/10 pointer-events-none"
          style={{
            left: marqueeStyles.left,
            top: marqueeStyles.top,
            width: marqueeStyles.width,
            height: marqueeStyles.height,
          }}
        />
      )}

      {/* Floating bubble */}
      {showQuickBubble && (
        <div className="fixed bottom-6 right-6 bg-neutral-900 text-white shadow-lg rounded-full px-4 py-2 flex items-center gap-3 animate-fade-in">
          <span className="text-sm">{uiSelection.length} selected</span>
          <div className="flex items-center gap-2">
            <button
              className="text-xs px-2 py-1 rounded bg-neutral-700 hover:bg-neutral-600"
              onClick={(e) => {
                e.stopPropagation();
                window.dispatchEvent(new Event("selection:selectAll"));
              }}
            >
              Select All
            </button>
            <button
              className="text-xs px-2 py-1 rounded bg-neutral-700 hover:bg-neutral-600"
              onClick={(e) => {
                e.stopPropagation();
                window.dispatchEvent(new Event("selection:clearAll"));
              }}
            >
              Clear
            </button>
            <button
              className="text-xs px-2 py-1 rounded bg-green-600 hover:bg-green-500"
              onClick={(e) => {
                e.stopPropagation();
                window.dispatchEvent(new Event("selection:approve"));
              }}
            >
              Approve
            </button>
            <button
              className="text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-500"
              onClick={(e) => {
                e.stopPropagation();
                window.dispatchEvent(new Event("selection:reject"));
              }}
            >
              Reject
            </button>
            <button
              className="text-xs px-2 py-1 rounded bg-blue-600 hover:bg-blue-500"
              onClick={(e) => {
                e.stopPropagation();
                window.dispatchEvent(new Event("selection:download"));
              }}
            >
              Download
            </button>
          </div>
        </div>
      )}
      {/* Lightbox */}
      {currentIndex !== null && (
        <Lightbox
          image={images[currentIndex]}
          onClose={close}
          onPrev={prev}
          onNext={next}
          onFavorite={(id) => mark(id, "favorite")}
          onApprove={(id) => mark(id, "approved")}
          onReject={(id) => mark(id, "rejected")}
          onClear={(id) => clearAll(id)}
          onPrint={(id) => togglePrint(id)}
        />
      )}
    </div>
  );
}
