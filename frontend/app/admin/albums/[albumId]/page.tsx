"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Session {
  id: number;
  token: string;
  email: string | null;
  created_at: string;
}

interface Album {
  id: number;
  title: string;
  images: any[];
  sessions: Session[];
  cover_url?: string | null;
  featured_image?: string | null;
  image_count?: number | null;
}

export default function AdminAlbumDetailPage() {
  const params = useParams();
  const albumId = Number(params.albumId);

  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const heroImage = album?.cover_url || album?.featured_image || album?.images?.[0]?.public_url || "";

  // Load album from backend API
  useEffect(() => {
    async function load() {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL;
        if (!API) throw new Error("Missing NEXT_PUBLIC_API_URL");

        const token = localStorage.getItem("admin_token");
        if (!token) throw new Error("Missing admin token");

        const res = await fetch(`${API}/admin/albums/${albumId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to load album");

        const data = await res.json();
        setAlbum(data);
      } catch (err: any) {
        setError(err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [albumId]);

  // Create magic link
  const generateMagicLink = async () => {
    try {
      const API = process.env.NEXT_PUBLIC_API_URL;
      const token = localStorage.getItem("admin_token");

      const res = await fetch(`${API}/admin/session/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ album_id: albumId }),
      });

      if (!res.ok) throw new Error("Failed to create session");

      const data = await res.json();
      alert(`Magic Link Generated:\n${data.magic_url}`);
    } catch (err: any) {
      alert(err.message);
      console.error(err);
    }
  };

  if (loading) return <p className="text-neutral-300">Loading album…</p>;
  if (error) return <p className="text-red-300">{error}</p>;
  if (!album) return <p className="text-neutral-300">Album not found.</p>;

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/30">
        {heroImage && (
          <div className="absolute inset-0">
            <img
              src={heroImage}
              alt="Album hero"
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
          </div>
        )}

        <div className="relative p-8 lg:p-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.25em] text-neutral-300">Album</p>
            <h1 className="text-3xl lg:text-4xl font-semibold text-white leading-tight">{album.title}</h1>
            <p className="text-neutral-300">{album.image_count ?? album.images?.length ?? 0} images</p>
          </div>

          <button
            className="relative inline-flex items-center justify-center px-5 py-3 rounded-xl overflow-hidden border border-white/20 bg-white/10 text-white font-semibold shadow-lg shadow-black/30 transition hover:-translate-y-0.5 hover:border-white/40"
            onClick={generateMagicLink}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-emerald-500/40 to-cyan-500/40 opacity-0 hover:opacity-100 transition" />
            <span className="relative">Generate Magic Link</span>
          </button>
        </div>
      </div>

      {/* Images */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-neutral-400">Images</p>
            <h2 className="text-xl font-semibold text-white">Album Images</h2>
          </div>
          <span className="text-sm text-neutral-400">{album.images?.length ?? 0} assets</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {album.images?.map((img) => (
            <div
              key={img.id}
              className="group relative rounded-2xl overflow-hidden border border-white/10 bg-white/5 shadow-lg shadow-black/20"
            >
              <img src={img.public_url} alt="" className="w-full h-full object-cover aspect-[4/3]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
            </div>
          ))}
        </div>
      </section>

      {/* Sessions */}
      <section className="space-y-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-neutral-400">Sessions</p>
          <h2 className="text-xl font-semibold text-white">Existing Sessions</h2>
        </div>
        <div className="grid gap-3">
          {album.sessions.map((s) => (
            <div
              key={s.id}
              className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-lg shadow-black/20"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-sm text-neutral-400">Token</p>
                  <p className="font-mono text-white break-all">{s.token}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-sm text-neutral-400">Created</p>
                  <p className="text-white">
                    {new Date(s.created_at).toLocaleString("en-US", { hour12: false })}
                  </p>
                </div>
              </div>
              <p className="text-sm text-neutral-300 mt-3">
                Email: <span className="font-semibold text-white">{s.email || "(none yet)"}</span>
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
