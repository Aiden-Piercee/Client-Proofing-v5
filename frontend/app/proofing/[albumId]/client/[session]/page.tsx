"use client";

import { useEffect, useMemo, useState } from "react";
import GalleryGrid from "@/components/GalleryGrid";
import SelectionToolbar from "@/components/SelectionToolbar";
import { validateSession, getAlbum, getAlbumImages } from "@/lib/api";
import { Image } from "@/lib/types";

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
  const [images, setImages] = useState<Image[]>([]);
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [albumImageUrls, setAlbumImageUrls] = useState<string[]>([]);

  // NEW — selection state for ZIP buttons
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      const session = await validateSession(sessionToken);
      const alb = await getAlbum(albumId);
      const imgs = await getAlbumImages(albumId, sessionToken);

      setSessionInfo(session);
      setAlbum(alb);
      setImages(imgs);

      const hero =
        pickPreviewImage(imgs) ||
        (alb.cover_url as string | null) ||
        (alb.featured_image as string | null);

      setBannerImage(hero);
      setAlbumImageUrls(imgs.map(makeDownloadURL));
    }
    load();
  }, [albumId, sessionToken]);

  const clientName = useMemo(
    () => sessionInfo?.client_name || "Client",
    [sessionInfo?.client_name]
  );

  if (!album || !sessionInfo) {
    return (
      <div className="p-6 text-neutral-400">Loading album...</div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="relative isolate overflow-hidden bg-neutral-950">
        <div className="absolute inset-0">
          {bannerImage ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${bannerImage})` }}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/55 to-neutral-950" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-12 md:pb-16">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.25em] text-neutral-400">
                Client Gallery
              </p>
              <h1 className="text-3xl md:text-5xl font-light tracking-tight">
                {album.title}
              </h1>
              <p className="text-neutral-400 text-sm">
                Viewing as {clientName}
              </p>
            </div>

            {bannerImage && (
              <div className="h-20 w-32 md:h-24 md:w-36 rounded-2xl overflow-hidden border border-white/10 shadow-lg shadow-black/30">
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${bannerImage})` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-12">
        <SelectionToolbar
          albumImages={albumImageUrls}
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
    </div>
  );
}

function pickPreviewImage(imgs: Image[]) {
  if (!imgs.length) return null;
  const hero = imgs[0];
  return (
    hero.full ||
    hero.large2x ||
    hero.large ||
    hero.medium2x ||
    hero.medium ||
    hero.small2x ||
    hero.small ||
    hero.thumb2x ||
    hero.thumb ||
    hero.tiny2x ||
    hero.tiny ||
    null
  );
}

function makeDownloadURL(img: Image): string {
  let path = img.storage_path || "";
  const filename = img.filename || "";
  path = path.replace(/^\/+/, "");
  const alreadyContainsFile = path.endsWith(filename);
  const fullPath = alreadyContainsFile ? path : `${path}/${filename}`;
  return `http://clients.chasing.media/dl.php?src=/storage/originals/${fullPath}`;
}
