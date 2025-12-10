"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { InspectorPanel } from "./InspectorPanel";
import { Sidebar } from "./Sidebar";
import { ThumbnailGrid } from "./ThumbnailGrid";
import { Toolbar } from "./Toolbar";
import {
  fetchAlbumWithImages,
  fetchAlbums,
  fetchGlobalContent,
  updateContentCategories,
  updateContentMetadata,
  updateContentTags,
} from "./kokenClient";
import { AlbumDetails, LibraryAlbum, LibraryContext, LibraryImage } from "./types";

const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="180" viewBox="0 0 240 180" fill="none"><rect width="240" height="180" rx="14" fill="#1f1f1f"/><path d="M60 132l32-40 26 34 18-24 24 38H60z" fill="#2b2b2b"/><circle cx="102" cy="70" r="14" fill="#333"/></svg>'
  );

function parseAlbumId(id: number | string | null | undefined) {
  const numeric = typeof id === "string" ? Number(id) : id;
  return Number.isFinite(numeric) ? (numeric as number) : null;
}

function normalizeVisibility(value?: number | string) {
  if (value === null || value === undefined) return "public";
  const numeric = typeof value === "string" ? Number(value) : value;
  if (numeric === 2) return "private";
  if (numeric === 1) return "unlisted";
  return "public";
}

function timestampToYear(value?: number | string | null) {
  if (value === null || value === undefined) return null;
  const numeric = typeof value === "string" ? Number(value) : value;
  if (!numeric) return null;
  return new Date(numeric * 1000).getFullYear();
}

const RECENT_DAYS = 30;

export default function LibraryPage() {
  const [albums, setAlbums] = useState<LibraryAlbum[]>([]);
  const [albumCache, setAlbumCache] = useState<Record<number, AlbumDetails>>({});
  const [globalImages, setGlobalImages] = useState<LibraryImage[]>([]);
  const [context, setContext] = useState<LibraryContext>({ scope: "all", filter: "content" });
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const [loadingAlbums, setLoadingAlbums] = useState(true);
  const [loadingContent, setLoadingContent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("captured-desc");
  const [visibleCount, setVisibleCount] = useState(24);
  const [columnEstimate, setColumnEstimate] = useState(5);
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false);
  const [previewImage, setPreviewImage] = useState<LibraryImage | null>(null);
  const [savingMeta, setSavingMeta] = useState(false);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    const handleResize = () => {
      const estimate = Math.max(4, Math.min(8, Math.floor(window.innerWidth / 220)));
      setColumnEstimate(estimate);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    async function loadAlbums() {
      setLoadingAlbums(true);
      setError(null);
      try {
        const data = await fetchAlbums();
        setAlbums(data);
        if (!context.albumId) {
          const first = data.find((album) => parseAlbumId(album.id) !== null);
          if (first) {
            setContext((prev) => ({ ...prev, albumId: parseAlbumId(first.id) }));
          }
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoadingAlbums(false);
      }
    }
    loadAlbums();
  }, []);

  useEffect(() => {
    async function loadGlobalContent() {
      if (globalImages.length > 0 || loadingContent || context.scope !== "all") return;
      setLoadingContent(true);
      setError(null);
      try {
        const images = await fetchGlobalContent();
        setGlobalImages(images);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoadingContent(false);
      }
    }
    loadGlobalContent();
  }, [context.scope, globalImages.length, loadingContent]);

  const fetchAlbumIfNeeded = useCallback(
    async (albumId: number) => {
      if (albumCache[albumId]) return albumCache[albumId];
      setLoadingContent(true);
      setError(null);
      try {
        const detail = await fetchAlbumWithImages(albumId);
        const normalized: AlbumDetails = {
          ...detail,
          images: detail.images.map((img) => ({
            ...img,
            album_id: albumId,
            album_title: detail.title ?? null,
            thumb: img.thumb || PLACEHOLDER,
          })),
        };
        setAlbumCache((prev) => ({ ...prev, [albumId]: normalized }));
        return normalized;
      } catch (err: any) {
        console.error(err);
        setError(err.message);
        return null;
      } finally {
        setLoadingContent(false);
      }
    },
    [albumCache]
  );

  useEffect(() => {
    if (context.scope === "album" && context.albumId) {
      fetchAlbumIfNeeded(context.albumId);
    }
  }, [context.scope, context.albumId, fetchAlbumIfNeeded]);

  useEffect(() => {
    const years = new Set<number>();
    globalImages.forEach((img) => {
      const year = timestampToYear(img.captured_on || img.uploaded_on || img.modified_on);
      if (year) years.add(year);
    });
    const yearList: number[] = [];
    years.forEach((value) => yearList.push(value));
    setAvailableYears(yearList.sort((a, b) => b - a));
  }, [globalImages]);

  const activeImages = useMemo(() => {
    let pool: LibraryImage[] = [];
    if (context.scope === "album" && context.albumId && albumCache[context.albumId]) {
      pool = albumCache[context.albumId].images;
    } else {
      pool = globalImages;
    }

    let filtered = [...pool];

    if (context.filter === "favorites") {
      filtered = filtered.filter((img) => !!img.favorite);
    }
    if (context.filter === "featured") {
      filtered = filtered.filter((img) => img.hasEditedReplacement || !!img.favorite);
    }
    if (context.filter === "quick") {
      filtered = filtered.filter((img) => img.print || img.state === "pick" || img.hasEditedReplacement);
    }
    if (context.filter === "unlisted") {
      filtered = filtered.filter((img) => normalizeVisibility(img.visibility) === "unlisted");
    }
    if (context.filter === "private") {
      filtered = filtered.filter((img) => normalizeVisibility(img.visibility) === "private");
    }
    if (context.filter === "lastImport") {
      const cutoff = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000;
      filtered = filtered.filter((img) => {
        const ts = (img.uploaded_on || img.modified_on || img.captured_on) ?? null;
        const numeric = typeof ts === "string" ? Number(ts) : ts;
        if (!numeric) return false;
        return numeric * 1000 >= cutoff;
      });
    }
    if (context.filter === "year" && context.year) {
      filtered = filtered.filter((img) => timestampToYear(img.captured_on || img.uploaded_on || img.modified_on) === context.year);
    }

    if (search.trim()) {
      const lowered = search.toLowerCase();
      filtered = filtered.filter((img) => {
        const title = img.title || img.filename || "";
        const tagString = (img.tags ?? []).join(" ");
        const categoryString = (img.categories ?? []).join(" ");
        return (
          title.toLowerCase().includes(lowered) ||
          tagString.toLowerCase().includes(lowered) ||
          categoryString.toLowerCase().includes(lowered)
        );
      });
    }

    filtered.sort((a, b) => {
      switch (sort) {
        case "captured-asc":
          return (a.captured_on || 0) > (b.captured_on || 0) ? 1 : -1;
        case "captured-desc":
          return (a.captured_on || 0) < (b.captured_on || 0) ? 1 : -1;
        case "name-asc":
          return (a.title || a.filename || "").localeCompare(b.title || b.filename || "");
        case "name-desc":
          return (b.title || b.filename || "").localeCompare(a.title || a.filename || "");
        case "id-asc":
          return a.id - b.id;
        case "id-desc":
          return b.id - a.id;
        default:
          return 0;
      }
    });

    return filtered.map((img) => ({
      ...img,
      thumb: img.thumb || PLACEHOLDER,
      medium: img.medium || img.thumb || PLACEHOLDER,
    }));
  }, [albumCache, context, globalImages, search, sort]);

  useEffect(() => {
    setVisibleCount(24);
    if (!activeImages.some((img) => img.id === selectedImageId)) {
      setSelectedImageId(activeImages[0]?.id ?? null);
    }
  }, [activeImages, selectedImageId]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!activeImages.length || !selectedImageId) return;
      const index = Math.max(0, activeImages.findIndex((img) => img.id === selectedImageId));
      let nextIndex = index;
      if (event.key === "ArrowRight") nextIndex = Math.min(activeImages.length - 1, index + 1);
      if (event.key === "ArrowLeft") nextIndex = Math.max(0, index - 1);
      if (event.key === "ArrowDown") nextIndex = Math.min(activeImages.length - 1, index + columnEstimate);
      if (event.key === "ArrowUp") nextIndex = Math.max(0, index - columnEstimate);
      if (nextIndex !== index) {
        event.preventDefault();
        setSelectedImageId(activeImages[nextIndex].id);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeImages, selectedImageId, columnEstimate]);

  const selectedImage = useMemo(
    () => activeImages.find((img) => img.id === selectedImageId) ?? null,
    [activeImages, selectedImageId]
  );

  const handleSelectFilter = (filter: LibraryContext["filter"], year?: number | null) => {
    setContext({ scope: "all", filter, year: year ?? null });
    setVisibleCount(24);
  };

  const handleSelectAlbum = (albumId: number, label?: string) => {
    setContext({ scope: "album", filter: "content", albumId, label: label ?? undefined });
    setVisibleCount(24);
  };

  const handleLoadMore = () => setVisibleCount((prev) => prev + 24);

  const handleSaveMetadata = async (payload: {
    title: string;
    caption: string;
    license: string;
    visibility: string;
    categories: string[];
    tags: string[];
    download: boolean;
  }) => {
    if (!selectedImage) return;
    setSavingMeta(true);
    setError(null);
    try {
      await updateContentMetadata(selectedImage.id, {
        title: payload.title,
        caption: payload.caption,
        license: payload.license,
        visibility: payload.visibility,
        download: payload.download,
      });
      await updateContentCategories(selectedImage.id, payload.categories);
      await updateContentTags(selectedImage.id, payload.tags);

      const applyUpdate = (images: LibraryImage[]) =>
        images.map((img) =>
          img.id === selectedImage.id
            ? {
                ...img,
                title: payload.title,
                caption: payload.caption,
                license: payload.license,
                visibility: payload.visibility,
                categories: payload.categories,
                tags: payload.tags,
                download: payload.download,
              }
            : img
        );

      if (context.scope === "album" && context.albumId) {
        setAlbumCache((prev) => {
          const existing = prev[context.albumId!];
          if (!existing) return prev;
          return {
            ...prev,
            [context.albumId!]: { ...existing, images: applyUpdate(existing.images) },
          };
        });
      }
      setGlobalImages((prev) => applyUpdate(prev));
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setSavingMeta(false);
    }
  };

  const refreshContent = async () => {
    setGlobalImages([]);
    setAlbumCache({});
    setSelectedImageId(null);
    setVisibleCount(24);
    setContext((prev) => ({ ...prev }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Koken-style Library</p>
          <h1 className="text-3xl font-semibold text-white">Content library</h1>
          <p className="text-neutral-400 text-sm mt-1">
            Modernised inspector + navigation that mirrors Koken’s mental model with three persistent panels.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-neutral-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(52,211,153,0.15)]" />
          Live Koken API
        </div>
      </div>

      {error && <p className="rounded-lg border border-red-500/40 bg-red-900/30 px-4 py-2 text-sm text-red-200">{error}</p>}

      <Toolbar
        context={context}
        total={activeImages.length}
        search={search}
        sort={sort}
        onSearchChange={setSearch}
        onSortChange={setSort}
        onRefresh={refreshContent}
      />

      <div className="grid grid-cols-12 gap-4 lg:gap-6">
        <div className="col-span-12 lg:col-span-3">
          <Sidebar
            albums={albums}
            activeContext={context}
            onSelectFilter={handleSelectFilter}
            onSelectAlbum={handleSelectAlbum}
            loadingAlbums={loadingAlbums}
            years={availableYears}
          />
        </div>

        <div className="col-span-12 lg:col-span-6 space-y-3">
          <ThumbnailGrid
            images={activeImages}
            selectedId={selectedImageId}
            onSelect={setSelectedImageId}
            onDoubleClick={(img) => setPreviewImage(img)}
            isLoading={loadingContent}
            visibleCount={visibleCount}
            onLoadMore={handleLoadMore}
            columnEstimate={columnEstimate}
          />
        </div>

        <div className="col-span-12 lg:col-span-3">
          <InspectorPanel
            image={selectedImage}
            albumTitle={context.scope === "album" && context.albumId ? albumCache[context.albumId]?.title : undefined}
            collapsed={inspectorCollapsed}
            onToggle={() => setInspectorCollapsed((prev) => !prev)}
            onSave={handleSaveMetadata}
            saving={savingMeta}
            error={error}
          />
        </div>
      </div>

      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
          <div className="relative w-full max-w-5xl rounded-2xl border border-white/10 bg-neutral-950 shadow-2xl shadow-black/50">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute right-3 top-3 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20"
            >
              Close
            </button>
            <div className="aspect-[16/9] w-full overflow-hidden rounded-2xl">
              <img
                src={previewImage.full || previewImage.large || previewImage.medium || previewImage.thumb || PLACEHOLDER}
                alt={previewImage.title || previewImage.filename || "Preview"}
                className="h-full w-full object-contain bg-neutral-900"
              />
            </div>
            <div className="p-4 text-sm text-neutral-300">
              <p className="text-white text-lg font-semibold">{previewImage.title || previewImage.filename || "Image"}</p>
              <p className="text-neutral-500">Double click any thumbnail to open full preview.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
