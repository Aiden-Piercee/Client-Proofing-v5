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
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#6f6f6f] mb-1">Library</p>
        <h1 className="text-[18px] font-semibold text-white leading-tight">Albums</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {albums.map((al) => (
          <Link href={`/admin/albums/${al.id}`} key={al.id} className="group">
            <div className="bg-[#1f1f1f] border border-[rgba(255,255,255,0.05)] rounded-[6px] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.35)] transition duration-150 group-hover:-translate-y-0.5 group-hover:border-[rgba(200,139,75,0.45)]">
              <div className="relative h-44 bg-[#0f0f0f]">
                <img
                  src={al.cover_url || NEUTRAL_PLACEHOLDER}
                  srcSet={`${al.cover_url || NEUTRAL_PLACEHOLDER} 1x, ${al.cover_url || NEUTRAL_PLACEHOLDER} 2x`}
                  alt="Album cover"
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
                <div className="absolute top-3 right-3 px-3 py-1 rounded-[4px] text-[12px] font-semibold bg-[rgba(0,0,0,0.6)] text-white border border-[rgba(255,255,255,0.08)]">
                  {al.image_count ?? 0} images
                </div>
              </div>

              <div className="p-3 space-y-1.5">
                <h2 className="text-[15px] font-semibold text-white leading-tight">
                  {al.title || "Untitled Album"}
                </h2>
                <p className="text-[13px] text-[#a4a4a4]">Album ID #{al.id}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
