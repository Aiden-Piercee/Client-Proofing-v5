"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// rename import to avoid conflict
import type { Album as KokenAlbum } from "@/lib/types";

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
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="90" viewBox="0 0 120 90" fill="none"><rect width="120" height="90" rx="8" fill="#f3f4f6"/><path d="M32 60l14-18 12 15 10-12 10 15H32z" fill="#d1d5db"/><circle cx="44" cy="38" r="6" fill="#e5e7eb"/></svg>'
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

  if (loading) return <p>Loading albums…</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Albums</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {albums.map((al) => (
          <Link href={`/admin/albums/${al.id}`} key={al.id}>
            <div className="p-4 bg-white shadow rounded-lg cursor-pointer hover:shadow-lg transition">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded overflow-hidden bg-neutral-100 border border-neutral-200 flex-shrink-0">
                  <img
                    src={al.cover_url || NEUTRAL_PLACEHOLDER}
                    alt="Album cover"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <h2 className="font-medium text-lg">{al.title}</h2>
                  <p className="text-sm text-neutral-500">
                    {al.image_count} images
                  </p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
