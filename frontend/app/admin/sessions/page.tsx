"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminSession, ClientLandingAlbum } from "@/lib/types";

const FALLBACK_COVER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="120" viewBox="0 0 180 120" fill="none"><rect width="180" height="120" rx="16" fill="#27272a"/><path d="M40 84l28-36 22 30 18-22 18 30H40z" fill="#3f3f46"/><circle cx="64" cy="54" r="10" fill="#52525b"/></svg>'
  );

type Filter = "all" | "ready" | "pending";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    async function load() {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL;
        if (!API) throw new Error("NEXT_PUBLIC_API_URL missing");

        const token = localStorage.getItem("admin_token");
        if (!token) throw new Error("Missing admin token");

        const res = await fetch(`${API}/admin/sessions`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to load sessions");

        const data: AdminSession[] = await res.json();
        setSessions(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const filteredSessions = useMemo(() => {
    if (filter === "pending") return sessions.filter((s) => !s.email);
    if (filter === "ready") return sessions.filter((s) => !!s.email);
    return sessions;
  }, [sessions, filter]);

  const copyToClipboard = async (value: string | undefined | null, label: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      alert(label);
    } catch (err) {
      alert("Unable to copy to clipboard");
      console.error(err);
    }
  };

  const landingLink = (session: AdminSession) => {
    if (session.landing_magic_url) return session.landing_magic_url;
    if (typeof window !== "undefined") {
      return `${window.location.origin}/proofing/landing/${session.token}`;
    }
    return "";
  };

  if (loading) return <p className="text-neutral-300">Loading sessions…</p>;
  if (error) return <p className="text-red-300">Error: {error}</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-neutral-400 mb-2">Access</p>
          <h1 className="text-3xl font-semibold text-white">Sessions</h1>
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full p-1 text-sm">
          <FilterButton label="All" active={filter === "all"} onClick={() => setFilter("all")} />
          <FilterButton label="Ready" active={filter === "ready"} onClick={() => setFilter("ready")} />
          <FilterButton label="Pending details" active={filter === "pending"} onClick={() => setFilter("pending")} />
        </div>
      </div>

      <div className="grid gap-3">
        {filteredSessions.map((s) => {
          const uniqueAlbums = dedupeAlbums(s.client_albums);
          const pending = !s.email;
          return (
            <div
              key={s.id}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/20"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.25em] text-neutral-400">Token</p>
                  <p className="font-mono text-white break-all text-sm">{s.token}</p>
                  <p className="text-neutral-400 text-sm">
                    Created: {new Date(s.created_at).toLocaleString("en-US", { hour12: false })}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Album</p>
                  <p className="text-white font-semibold">#{s.album_id}</p>
                  <p className="text-neutral-300 max-w-xs truncate">{s.album?.title ?? "Untitled"}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-4">
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm border ${
                    pending
                      ? "bg-amber-500/10 border-amber-300/40 text-amber-100"
                      : "bg-emerald-500/10 border-emerald-300/40 text-emerald-100"
                  }`}
                >
                  {pending ? "Pending client details" : s.email}
                </span>
                <button
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-sm text-white hover:border-white/40 transition"
                  onClick={() => copyToClipboard(landingLink(s), "Landing link copied")}
                >
                  🔗 Copy landing link
                </button>
              </div>

              <div className="mt-5 space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Galleries for this client</p>
                <div className="flex flex-wrap gap-3">
                  {uniqueAlbums.length === 0 && (
                    <span className="text-neutral-400 text-sm">No linked galleries yet.</span>
                  )}
                  {uniqueAlbums.map((album) => (
                    <div
                      key={`${s.id}-${album.album_id}`}
                      className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3 min-w-[260px]"
                    >
                      <div className="h-14 w-20 overflow-hidden rounded-lg bg-neutral-800">
                        <img
                          src={album.album?.cover_url || FALLBACK_COVER}
                          alt={album.album?.title || "Album"}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-semibold truncate">{album.album?.title || "Untitled album"}</p>
                        <p className="text-xs text-neutral-400">Album #{album.album_id}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <button
                            className="text-xs inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-white hover:bg-white/20 transition"
                            onClick={() => copyToClipboard(album.magic_url, "Magic link copied")}
                          >
                            ✉️ Magic link
                          </button>
                          <a
                            href={`/proofing/${album.album_id}/client/${album.token}`}
                            className="text-xs inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-1 text-cyan-100 hover:bg-cyan-500/20 transition"
                          >
                            ▶️ Open
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FilterButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full transition text-sm ${
        active ? "bg-white text-black shadow" : "text-neutral-300 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function dedupeAlbums(albums?: ClientLandingAlbum[]) {
  if (!albums || albums.length === 0) return [] as ClientLandingAlbum[];
  const map = new Map<number, ClientLandingAlbum>();
  for (const album of albums) {
    if (!map.has(album.album_id)) {
      map.set(album.album_id, album);
    }
  }
  return Array.from(map.values());
}
