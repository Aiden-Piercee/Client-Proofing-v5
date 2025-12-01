"use client";

import React, { useState, useEffect } from "react";
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

  // Update selection (only favorite + approved)
  const updateSelection = (updatedImages: Image[]) => {
    const selected = updatedImages
      .filter((img) => img.state === "favorite" || img.state === "approved")
      .map((img) => makeDownloadURL(img));

    onSelectionChange(selected);
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

  // Loading / error
  if (loading)
    return <div className="text-neutral-400 w-full text-center py-10">Loading...</div>;

  if (error)
    return <div className="text-red-400 w-full text-center py-10">{error}</div>;

  // Render
  return (
    <>
      {/* Thumbnails */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-2">
        {images.map((img, index) => (
          <ImageCard
            key={img.id}
            image={img}
            onClick={() => open(index)}
            onFavorite={() => mark(img.id, "favorite")}
            onApprove={() => mark(img.id, "approved")}
            onReject={() => mark(img.id, "rejected")}
            onClear={() => clearAll(img.id)}      // FIXED ✔ clears print too
            onPrint={() => togglePrint(img.id)}
          />
        ))}
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
