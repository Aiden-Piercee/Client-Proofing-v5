"use client";

import { useEffect, useMemo, useState } from "react";

interface LibraryAlbum {
  id: number | string;
  title: string | null;
  image_count?: number | null;
  visibility?: number | string;
  created_on?: number | string;
  cover_url?: string | null;
}

interface LibraryImage {
  id: number;
  title: string | null;
  thumb?: string | null;
  medium?: string | null;
  large?: string | null;
  full?: string | null;
  filename?: string | null;
  public_url?: string | null;
  hasEditedReplacement?: boolean;
  isEditedReplacement?: boolean;
  original_image_id?: number | null;
}

interface AlbumDetails extends LibraryAlbum {
  images: LibraryImage[];
}

const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="120" viewBox="0 0 180 120" fill="none"><rect width="180" height="120" rx="12" fill="#111827"/><path d="M48 86l22-28 18 23 14-18 14 23H48z" fill="#1f2937"/><circle cx="74" cy="46" r="10" fill="#27303f"/></svg>'
  );

function formatTimestamp(value?: number | string | null) {
  if (value === null || value === undefined) return "";
  const numeric = typeof value === "string" ? Number(value) : value;
  if (!numeric) return "";
  const date = new Date(numeric * 1000);
  return date.toLocaleString();
}

function parseAlbumId(id: number | string | null | undefined) {
  const numeric = typeof id === "string" ? Number(id) : id;
  return Number.isFinite(numeric) ? (numeric as number) : null;
}

export default function LibraryPage() {
  const [albums, setAlbums] = useState<LibraryAlbum[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<number | null>(null);
  const [albumDetails, setAlbumDetails] = useState<AlbumDetails | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const [loadingAlbums, setLoadingAlbums] = useState(true);
  const [loadingImages, setLoadingImages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    async function fetchAlbums() {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL;
        if (!API) throw new Error("NEXT_PUBLIC_API_URL missing");

        const token = localStorage.getItem("admin_token");
        if (!token) throw new Error("Missing admin token");

        const res = await fetch(`${API}/admin/albums`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Unable to load albums from Koken");
        const data: LibraryAlbum[] = await res.json();
        const firstNumericAlbum = data.find((album) => parseAlbumId(album.id) !== null);

        setAlbums(data);

        if (firstNumericAlbum) {
          setSelectedAlbumId(parseAlbumId(firstNumericAlbum.id));
        } else {
          setError("No albums with a valid numeric id were returned from Koken.");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoadingAlbums(false);
      }
    }

    fetchAlbums();
  }, []);

  useEffect(() => {
    async function fetchAlbumDetails() {
      if (!selectedAlbumId) return;
      try {
        setLoadingImages(true);
        setError(null);
        const API = process.env.NEXT_PUBLIC_API_URL;
        if (!API) throw new Error("NEXT_PUBLIC_API_URL missing");
        const token = localStorage.getItem("admin_token");
        if (!token) throw new Error("Missing admin token");

        const res = await fetch(`${API}/admin/albums/${selectedAlbumId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Unable to load album detail");
        const data: AlbumDetails = await res.json();
        setAlbumDetails(data);
        if (data.images?.length) {
          setSelectedImageId(data.images[0].id);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoadingImages(false);
      }
    }

    fetchAlbumDetails();
  }, [selectedAlbumId]);

  const selectedImage = useMemo(() => {
    if (!albumDetails || !albumDetails.images) return null;
    return albumDetails.images.find((img) => img.id === selectedImageId) ?? albumDetails.images[0] ?? null;
  }, [albumDetails, selectedImageId]);

  const filteredImages = useMemo(() => {
    if (!albumDetails?.images) return [] as LibraryImage[];
    if (!filter.trim()) return albumDetails.images;
    const lowered = filter.toLowerCase();
    return albumDetails.images.filter((img) => {
      const title = img.title || img.filename || "";
      return title.toLowerCase().includes(lowered);
    });
  }, [albumDetails, filter]);

  const totalImages = filteredImages.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-neutral-400">Library</p>
          <h1 className="text-3xl font-semibold text-white">Image Library</h1>
          <p className="text-neutral-400 text-sm mt-1">Live feed from the Koken API, wrapped in a modern admin shell.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter images"
            className="h-10 w-48 rounded-lg bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/20"
          />
          <button className="h-10 px-4 rounded-lg border border-white/10 text-sm text-white bg-white/5 hover:bg-white/10 transition">
            Upload
          </button>
          <button className="h-10 px-4 rounded-lg border border-white/10 text-sm text-white bg-white/5 hover:bg-white/10 transition">
            Download
          </button>
        </div>
      </div>

      {error && <p className="text-red-300 bg-red-900/30 border border-red-500/40 rounded-lg px-3 py-2">{error}</p>}

      <div className="grid grid-cols-12 gap-4">
        <aside className="col-span-12 lg:col-span-3 space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl shadow-black/30">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-400">Library</p>
                <h2 className="text-lg font-semibold text-white">Collections</h2>
              </div>
              <span className="px-2 py-1 text-[11px] rounded-md bg-white/10 text-white border border-white/10">
                {albums.length} albums
              </span>
            </div>
            <div className="space-y-1">
              {["All content", "Favorites", "Featured", "Categories", "Timeline", "Stars"].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-neutral-300 hover:bg-white/5 hover:text-white transition"
                >
                  <span>{item}</span>
                  <span className="text-neutral-500">&rsaquo;</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl shadow-black/30">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-400">Albums</p>
                <h2 className="text-lg font-semibold text-white">Koken library</h2>
              </div>
              <button className="px-2 py-1 text-[11px] rounded-md bg-white/10 text-white border border-white/10 hover:bg-white/20 transition">
                New album
              </button>
            </div>
            <div className="space-y-1 max-h-[420px] overflow-auto pr-1">
              {loadingAlbums && <p className="text-neutral-400 text-sm">Loading albums…</p>}
              {!loadingAlbums && albums.length === 0 && (
                <p className="text-neutral-400 text-sm">No albums found.</p>
              )}
              {albums.map((album) => {
                const active = parseAlbumId(album.id) === selectedAlbumId;
                return (
                  <button
                    key={album.id}
                    onClick={() => {
                      const parsed = parseAlbumId(album.id);
                      if (parsed === null) {
                        setError("Album id is not numeric, unable to load details.");
                        return;
                      }

                      setError(null);
                      setSelectedAlbumId(parsed);
                    }}
                    className={`w-full flex items-start gap-3 rounded-lg px-3 py-2 text-left transition border ${
                      active
                        ? "bg-white/10 border-white/20 text-white"
                        : "border-transparent text-neutral-300 hover:border-white/10 hover:text-white"
                    }`}
                  >
                    <div className="h-11 w-16 rounded-md overflow-hidden bg-neutral-900 border border-white/10 relative">
                      <img
                        src={album.cover_url || PLACEHOLDER}
                        alt={album.title || "Album cover"}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{album.title || "Untitled album"}</p>
                      <p className="text-xs text-neutral-400">{album.image_count ?? "–"} items</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl shadow-black/30">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white">Data sets</h3>
              <button className="text-xs text-neutral-400 hover:text-white">Manage</button>
            </div>
            <div className="space-y-1">
              {["albums", "categories", "content", "custompages", "tags"].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-neutral-300 hover:bg-white/5 hover:text-white transition"
                >
                  <span className="capitalize">{item}</span>
                  <span className="text-neutral-500">&rsaquo;</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="col-span-12 lg:col-span-6 space-y-3">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl shadow-black/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-400">Content</p>
                <h2 className="text-lg font-semibold text-white">
                  {albumDetails?.title || "Select an album"}
                </h2>
                <p className="text-xs text-neutral-400">{totalImages} items</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-300">
                <span className="px-2 py-1 rounded-lg border border-white/10 bg-white/5">Grid</span>
                <span className="px-2 py-1 rounded-lg border border-white/10 bg-black/40 text-neutral-500">List</span>
                <span className="px-2 py-1 rounded-lg border border-white/10 bg-black/40 text-neutral-500">Details</span>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl shadow-black/30 min-h-[480px]">
            {loadingImages && <p className="text-neutral-400 text-sm">Loading images…</p>}
            {!loadingImages && filteredImages.length === 0 && (
              <p className="text-neutral-400 text-sm">No images for this album.</p>
            )}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredImages.map((img) => {
                const selected = img.id === selectedImage?.id;
                return (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImageId(img.id)}
                    className={`group relative rounded-xl overflow-hidden border transition focus:outline-none ${
                      selected
                        ? "border-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.25)]"
                        : "border-white/10 hover:border-white/25"
                    }`}
                  >
                    <div className="aspect-[4/3] bg-neutral-900">
                      <img
                        src={img.medium || img.thumb || PLACEHOLDER}
                        srcSet={`${img.medium || img.thumb || PLACEHOLDER} 1x, ${img.large || img.medium || img.thumb || PLACEHOLDER} 2x`}
                        alt={img.title || "Library image"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between text-sm text-white bg-gradient-to-t from-black/70 via-black/40 to-transparent">
                      <span className="truncate">{img.title || img.filename || `Image #${img.id}`}</span>
                      {img.hasEditedReplacement && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/80 text-[11px] uppercase">Edited</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <aside className="col-span-12 lg:col-span-3 space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl shadow-black/30 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-400">Content</p>
                <h2 className="text-lg font-semibold text-white">Details</h2>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-300">
                <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_0_6px_rgba(251,191,36,0.15)]" />
                <span>Album</span>
              </div>
            </div>

            {!selectedImage && <p className="text-neutral-400 text-sm">Select an image to see metadata.</p>}

            {selectedImage && (
              <div className="space-y-3">
                <div className="rounded-xl overflow-hidden border border-white/10 bg-neutral-900">
                  <img
                    src={selectedImage.medium || selectedImage.thumb || PLACEHOLDER}
                    alt={selectedImage.title || "Selected image"}
                    className="w-full h-44 object-cover"
                  />
                </div>
                <div className="space-y-2">
                  <div>
                    <h3 className="text-base font-semibold text-white leading-tight">
                      {selectedImage.title || selectedImage.filename || `Image #${selectedImage.id}`}
                    </h3>
                    <p className="text-xs text-neutral-400">ID: {selectedImage.id}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-neutral-300">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-2">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">Album</p>
                      <p className="font-semibold text-white truncate">{albumDetails?.title || "—"}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-2">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">Filename</p>
                      <p className="font-semibold text-white truncate">{selectedImage.filename || "—"}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-2">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">Visibility</p>
                      <p className="font-semibold text-white">Visible</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-2">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">Captured</p>
                      <p className="font-semibold text-white">{formatTimestamp(albumDetails?.created_on) || "—"}</p>
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-neutral-300">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-400 mb-1">Replacement</p>
                    <p>
                      {selectedImage.hasEditedReplacement
                        ? "Has an edited replacement attached"
                        : "Original upload from Koken"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="flex-1 h-10 rounded-lg border border-white/10 bg-white/5 text-sm text-white hover:bg-white/10 transition">
                      Toggle visibility
                    </button>
                    <button className="flex-1 h-10 rounded-lg border border-white/10 bg-gradient-to-r from-amber-500 to-rose-500 text-sm font-semibold text-white shadow-lg shadow-amber-900/30 hover:from-amber-400 hover:to-rose-400 transition">
                      Use as album cover
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
