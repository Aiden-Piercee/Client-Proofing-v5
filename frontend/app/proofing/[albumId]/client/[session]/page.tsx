"use client";

import { useEffect, useState } from "react";
import GalleryGrid from "@/components/GalleryGrid";
import SelectionToolbar from "@/components/SelectionToolbar";
import { validateSession, getAlbum } from "@/lib/api";

interface Props {
  params: {
    albumId: string;
    session: string;
  };
}

export default function SessionPage({ params }: Props) {
  const albumId = Number(params.albumId);
  const sessionToken = params.session;

  const [album, setAlbum] = useState<any>(null);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [bannerImage, setBannerImage] = useState<string | null>(null);

  // NEW — selection state for ZIP buttons
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      const session = await validateSession(sessionToken);
      const alb = await getAlbum(albumId);

      setSessionInfo(session);
      setAlbum(alb);
    }
    load();
  }, [albumId, sessionToken]);

  useEffect(() => {
    if (album?.images?.length) {
      const randomIndex = Math.floor(Math.random() * album.images.length);
      setBannerImage(album.images[randomIndex]);
    } else {
      setBannerImage(null);
    }
  }, [album]);

  if (!album || !sessionInfo) {
    return (
      <div className="p-6 text-neutral-400">Loading album...</div>
    );
  }

  return (
    <div className="p-6 text-neutral-300">
      {bannerImage && (
        <div className="relative w-full h-60 mb-6 overflow-hidden">
          <div
            className="absolute inset-0 bg-center bg-cover blur-2xl opacity-25"
            style={{ backgroundImage: `url(${bannerImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/50 via-neutral-900/30 to-transparent" />
        </div>
      )}

      <h1 className="text-xl font-semibold mb-2">{album.title}</h1>
      <p className="text-neutral-500 mb-6">
        Viewing as: {sessionInfo.client_name}
      </p>

      <SelectionToolbar
        albumImages={album.images}
        selectedImages={selectedImages}
      />

      <GalleryGrid
        albumId={albumId}
        sessionToken={sessionToken}
        sessionEmail={sessionInfo.email ?? null}
        selectedImages={selectedImages}
        onSelectionChange={setSelectedImages}
      />
    </div>
  );
}
