"use client";

import React, { useState, useEffect, useMemo } from "react";
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

type FilterType = "all" | "favorite" | "approved" | "rejected";

export default function GalleryGrid({
  albumId,
  sessionToken,
  sessionEmail,
  onSelectionChange,
}: Props) {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

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

  useEffect(() => {
    if (sessionEmail) {
      localStorage.setItem("clientproofing:email", sessionEmail);
    }
  }, [sessionEmail]);

  const makeDownloadURL = (img: Image): string => {
    let path = img.storage_path || "";
    let filename = img.filename || "";
    path = path.replace(/^\/+/, "");
    const alreadyContainsFile = path.endsWith(filename);
    const fullPath = alreadyContainsFile ? path : `${path}/${filename}`;
    return `http://clients.chasing.media/dl.php?src=/storage/originals/${fullPath}`;
  };

  const updateSelection = (updatedImages: Image[]) => {
    const selected = updatedImages
      .filter((img) => img.state === "favorite" || img.state === "approved")
      .map((img) => makeDownloadURL(img));
    onSelectionChange(selected);
  };

  const mark = async (
    id: number,
    state: "favorite" | "approved" | "rejected" | null
  ) => {
    const updated = images.map((img) =>
      img.id === id ? { ...img, state, print: state === "rejected" ? false : img.print } : img
    );
    setImages(updated);
    updateSelection(updated);
    await sendSelection({ sessionToken, imageId: id, state });
  };

  const clearAll = async (id: number) => {
    const updated = images.map((img) =>
      img.id === id ? { ...img, state: null, print: false } : img
    );
    setImages(updated);
    updateSelection(updated);
    await sendSelection({ sessionToken, imageId: id, state: null, print: false });
  };

  const togglePrint = async (id: number) => {
    const original = images.find((i) => i.id === id);
    if (!original || original.state === "rejected") return;
    const updated = images.map((img) =>
      img.id === id ? { ...img, print: !img.print } : img
    );
    setImages(updated);
    await sendSelection({ sessionToken, imageId: id, print: !original.print });
  };

  const open = (index: number) => setCurrentIndex(index);
  const close = () => setCurrentIndex(null);
  const prev = () => setCurrentIndex((i) => (i! > 0 ? i! - 1 : images.length - 1));
  const next = () => setCurrentIndex((i) => (i! < images.length - 1 ? i! + 1 : 0));

  const filteredImages = useMemo(() => {
    if (activeFilter === "all") return images;
    return images.filter((img) => img.state === activeFilter);
  }, [images, activeFilter]);

  const stats = useMemo(
    () => ({
      favorites: images.filter((i) => i.state === "favorite").length,
      approved: images.filter((i) => i.state === "approved").length,
      rejected: images.filter((i) => i.state === "rejected").length,
    }),
    [images]
  );

  if (loading)
    return <div className="flex h-64 items-center justify-center text-neutral-400">Loading Gallery...</div>;
  if (error) return <div className="flex h-64 items-center justify-center text-red-400">{error}</div>;

  return (
    <div className="min-h-screen bg-white text-black dark:bg-neutral-950 dark:text-white pb-20">
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 transition-all">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-1">
            <FilterBtn label="All Photos" count={images.length} isActive={activeFilter === "all"} onClick={() => setActiveFilter("all")} />
            <FilterBtn label="Favorites" count={stats.favorites} isActive={activeFilter === "favorite"} onClick={() => setActiveFilter("favorite")} />
            {stats.approved > 0 && (
              <FilterBtn label="Approved" count={stats.approved} isActive={activeFilter === "approved"} onClick={() => setActiveFilter("approved")} />
            )}
          </div>

          <div className="text-xs uppercase tracking-widest text-neutral-500 hidden sm:block">Proofing Selection</div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto p-4 sm:p-6">
        {filteredImages.length === 0 ? (
          <div className="text-center py-20 text-neutral-500 font-light">No images found in this filter.</div>
        ) : (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
            {filteredImages.map((img) => {
              const globalIndex = images.findIndex((i) => i.id === img.id);

              return (
                <div key={img.id} className="break-inside-avoid relative group mb-4">
                  <ImageCard
                    image={img}
                    onClick={() => open(globalIndex)}
                    onFavorite={() => mark(img.id, "favorite")}
                    onApprove={() => mark(img.id, "approved")}
                    onReject={() => mark(img.id, "rejected")}
                    onClear={() => clearAll(img.id)}
                    onPrint={() => togglePrint(img.id)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

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

function FilterBtn({
  label,
  count,
  isActive,
  onClick,
}: {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
        isActive
          ? "bg-black text-white dark:bg-white dark:text-black shadow-md"
          : "text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
      }`}
    >
      {label} <span className={`ml-1 text-xs opacity-60 ${isActive ? "" : "text-neutral-400"}`}>{count}</span>
    </button>
  );
}
