"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// this is your admin-side album type
interface AdminAlbum {
  id: number;
  title: string | null;
  image_count?: number | null;
  created_on?: number;
  cover_url?: string | null;
}

const NEUTRAL_PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="90" viewBox="0 0 120 90" fill="none"><rect width="120" height="90" rx="8" fill="#27272a"/><path d="M32 60l14-18 12 15 10-12 10 15H32z" fill="#3f3f46"/><circle cx="44" cy="38" r="6" fill="#52525b"/></svg>'
  );

export default function AdminAlbumsPage() {
  const [albums, setAlbums] = useState<AdminAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
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

        if (!res.ok) throw new Error("Failed to load albums");

        const data: AdminAlbum[] = await res.json();
        setAlbums(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading)
    return <p className="text-neutral-300">Loading albums…</p>;
  if (error) return <p className="text-red-300">Error: {error}</p>;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-neutral-400 mb-2">Library</p>
        <h1 className="text-3xl font-semibold text-white">Albums</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {albums.map((al) => (
          <Link href={`/admin/albums/${al.id}`} key={al.id} className="group">
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/30 transition duration-200 group-hover:-translate-y-1 group-hover:border-white/25">
              <div className="relative h-44 bg-neutral-900">
                <img
                  src={al.cover_url || NEUTRAL_PLACEHOLDER}
                  alt="Album cover"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white backdrop-blur">
                  {al.image_count ?? 0} images
                </div>
              </div>

              <div className="p-4 space-y-2">
                <h2 className="text-lg font-semibold text-white leading-tight">
                  {al.title || "Untitled Album"}
                </h2>
                <p className="text-sm text-neutral-400">Album ID #{al.id}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
