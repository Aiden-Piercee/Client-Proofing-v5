"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  selectedImages: _selectedImages,
  onSelectionChange,
}: Props) {
  // Local state
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [marqueeRect, setMarqueeRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dragSelectionRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const pendingRectRef = useRef<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  // Load album images
  useEffect(() => {
    async function load() {
      try {
        setError(null);
        const imgs = await getAlbumImages(albumId, sessionToken);
        setImages(imgs);
        setSelectedIds([]);
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

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", handleMoveRef.current);
      window.removeEventListener("mouseup", handleUpRef.current);

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Sync download URLs when selection or images change
  useEffect(() => {
    const selectedUrls = images
      .filter((img) => selectedIds.includes(img.id))
      .map((img) => makeDownloadURL(img));

    onSelectionChange(selectedUrls);
  }, [images, onSelectionChange, selectedIds]);

  const toggleSingleSelection = (index: number) => {
    const img = images[index];
    if (!img) return;

    setSelectedIds((prev) => {
      const alreadySelected = prev.includes(img.id);
      const next = alreadySelected
        ? prev.filter((id) => id !== img.id)
        : [...prev, img.id];

      return next;
    });
    setLastSelectedIndex(index);
  };

  const handleRangeSelection = (index: number) => {
    if (!images[index]) return;

    const anchor = lastSelectedIndex ?? index;
    const [start, end] =
      anchor < index ? [anchor, index] : [index, anchor];

    const idsInRange = images
      .slice(start, end + 1)
      .map((img) => img.id)
      .filter(Boolean);

    setSelectedIds((prev) => Array.from(new Set([...prev, ...idsInRange])));
    setLastSelectedIndex(index);
  };

  const handleImageClick = (
    event: React.MouseEvent,
    index: number
  ) => {
    if (event.shiftKey) {
      event.preventDefault();
      handleRangeSelection(index);
      return;
    }

    if (event.metaKey || event.ctrlKey) {
      event.preventDefault();
      toggleSingleSelection(index);
      return;
    }

    open(index);
  };

  const normalizeRect = useCallback(
    (startX: number, startY: number, currentX: number, currentY: number) => ({
      left: Math.min(startX, currentX),
      top: Math.min(startY, currentY),
      width: Math.abs(currentX - startX),
      height: Math.abs(currentY - startY),
    }),
    []
  );

  const applyMarqueeSelection = useCallback(
    (rect: { left: number; top: number; width: number; height: number }) => {
      if (!rect.width && !rect.height) return;

      const intersectingIds = images.reduce<number[]>((acc, img, idx) => {
        const card = cardRefs.current[idx];
        if (!card) return acc;

        const bounds = card.getBoundingClientRect();
        const intersects =
          rect.left < bounds.right &&
          rect.left + rect.width > bounds.left &&
          rect.top < bounds.bottom &&
          rect.top + rect.height > bounds.top;

        if (intersects) acc.push(img.id);
        return acc;
      }, []);

      setSelectedIds((prev) => {
        const startSelection = dragSelectionRef.current;
        const merged = Array.from(new Set([...startSelection, ...intersectingIds]));
        return merged;
      });
    },
    [images]
  );

  const scheduleIntersectionCheck = useCallback(
    (rect: { left: number; top: number; width: number; height: number }) => {
      pendingRectRef.current = rect;

      if (rafRef.current) return;

      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;

        if (pendingRectRef.current) {
          applyMarqueeSelection(pendingRectRef.current);
        }
      });
    },
    [applyMarqueeSelection]
  );

  const handleMarqueeMouseMove = useCallback(
    (startX: number, startY: number, event: MouseEvent) => {
      const rect = normalizeRect(startX, startY, event.clientX, event.clientY);
      setMarqueeRect(rect);
      scheduleIntersectionCheck(rect);
    },
    [normalizeRect, scheduleIntersectionCheck]
  );

  const stopMarquee = useCallback(() => {
    setMarqueeRect(null);
    window.removeEventListener("mousemove", handleMoveRef.current);
    window.removeEventListener("mouseup", handleUpRef.current);
  }, []);

  const handleMoveRef = useRef<(event: MouseEvent) => void>(() => {});
  const handleUpRef = useRef<(event: MouseEvent) => void>(() => {});

  const handleMarqueeMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;

    const target = event.target as HTMLElement;
    if (target.closest("[data-image-card]")) return;

    event.preventDefault();

    const startX = event.clientX;
    const startY = event.clientY;

    dragSelectionRef.current = [...selectedIds];
    setMarqueeRect({ left: startX, top: startY, width: 0, height: 0 });

    handleMoveRef.current = (e: MouseEvent) => handleMarqueeMouseMove(startX, startY, e);
    handleUpRef.current = () => {
      stopMarquee();
    };

    window.addEventListener("mousemove", handleMoveRef.current);
    window.addEventListener("mouseup", handleUpRef.current);
  };

  // Lightbox controls
  const open = (index: number) => setCurrentIndex(index);
  const close = () => setCurrentIndex(null);
  const prev = () => setCurrentIndex((i) => (i! > 0 ? i! - 1 : images.length - 1));
  const next = () => setCurrentIndex((i) => (i! < images.length - 1 ? i! + 1 : 0));

  // Loading / error
  if (loading)
    return <div className="text-neutral-400 w-full text-center py-10">Loading...</div>;

  if (error)
    return <div className="text-red-400 w-full text-center py-10">{error}</div>;

  // Render
  return (
    <>
      {/* Thumbnails */}
      <div
        ref={containerRef}
        className="relative"
        onMouseDown={handleMarqueeMouseDown}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-2 select-none">
          {images.map((img, index) => (
            <ImageCard
              key={img.id}
              image={img}
              selected={selectedIds.includes(img.id)}
              onClick={(event) => handleImageClick(event, index)}
              onToggleSelect={() => toggleSingleSelection(index)}
              onFavorite={() => mark(img.id, "favorite")}
              onApprove={() => mark(img.id, "approved")}
              onReject={() => mark(img.id, "rejected")}
              onClear={() => clearAll(img.id)}      // FIXED ✔ clears print too
              onPrint={() => togglePrint(img.id)}
              cardRef={(el) => (cardRefs.current[index] = el)}
            />
          ))}
        </div>

        {marqueeRect && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              clipPath: `inset(0 0 0 0)`,
            }}
          >
            <div
              className="absolute border-2 border-emerald-400/80 bg-emerald-400/10 backdrop-blur-[1px] rounded-md shadow-[0_10px_30px_rgba(16,185,129,0.2)]"
              style={{
                left: marqueeRect.left - (containerRef.current?.getBoundingClientRect().left ?? 0),
                top: marqueeRect.top - (containerRef.current?.getBoundingClientRect().top ?? 0),
                width: marqueeRect.width,
                height: marqueeRect.height,
              }}
            />
          </div>
        )}
      </div>

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
          onClear={(id) => clearAll(id)}         // FIXED ✔ clears print too
          onPrint={(id) => togglePrint(id)}
        />
      )}
    </>
  );
}
