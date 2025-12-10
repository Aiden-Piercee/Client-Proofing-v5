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

  const absoluteUrl = (path?: string | null) => {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;

    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");

    if (!origin) return path;

    return `${origin}${path.startsWith("/") ? "" : "/"}${path}`;
  };

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

    const copyWithFallback = () => {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "absolute";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    };

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        copyWithFallback();
      }
      alert(label);
    } catch (err) {
      alert("Unable to copy to clipboard");
      console.error(err);
    }
  };

  const landingLink = (session: AdminSession) => {
    if (session.landing_magic_url) return absoluteUrl(session.landing_magic_url);
    return absoluteUrl(`/proofing/landing/${session.token}`);
  };

  if (loading) return <p className="text-neutral-300">Loading sessions…</p>;
  if (error) return <p className="text-red-300">Error: {error}</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#6f6f6f] mb-1">Access</p>
          <h1 className="text-[18px] font-semibold text-white leading-tight">Sessions</h1>
        </div>
        <div className="flex items-center gap-2 bg-[#1f1f1f] border border-[rgba(255,255,255,0.08)] rounded-[6px] p-1 text-[13px] shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
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
              className="bg-[#1f1f1f] border border-[rgba(255,255,255,0.05)] rounded-[6px] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[#6f6f6f]">Token</p>
                  <p className="font-mono text-white break-all text-[13px]">{s.token}</p>
                  <p className="text-[#a4a4a4] text-[13px]">
                    Created: {new Date(s.created_at).toLocaleString("en-US", { hour12: false })}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#6f6f6f]">Album</p>
                  <p className="text-white font-semibold text-[15px]">#{s.album_id}</p>
                  <p className="text-[#a4a4a4] text-[13px] max-w-xs truncate">{s.album?.title ?? "Untitled"}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-4">
                <span
                  className={`inline-flex items-center gap-2 rounded-[5px] px-3 py-1 text-[13px] border ${
                    pending
                      ? "bg-[rgba(200,139,75,0.15)] border-[rgba(200,139,75,0.45)] text-[#f2d3a4]"
                      : "bg-[rgba(34,197,94,0.12)] border-[rgba(34,197,94,0.4)] text-emerald-100"
                  }`}
                >
                  {pending ? "Pending client details" : s.email}
                </span>
                <button
                  className="inline-flex items-center gap-2 rounded-[5px] border border-[rgba(255,255,255,0.08)] px-3 py-1 text-[13px] text-white hover:border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.04)] transition duration-125"
                  onClick={() => copyToClipboard(landingLink(s), "Landing link copied")}
                >
                  🔗 Copy landing link
                </button>
              </div>

              <div className="mt-5 space-y-2">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#6f6f6f]">Galleries for this client</p>
                <div className="flex flex-wrap gap-3">
                  {uniqueAlbums.length === 0 && (
                    <span className="text-[#a4a4a4] text-[13px]">No linked galleries yet.</span>
                  )}
                  {uniqueAlbums.map((album) => (
                    <div
                      key={`${s.id}-${album.album_id}`}
                      className="flex items-center gap-3 bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] rounded-[6px] p-3 min-w-[260px]"
                    >
                      <a
                        href={`/admin/albums/${album.album_id}`}
                        className="h-14 w-20 overflow-hidden rounded-[4px] bg-[#0f0f0f] ring-0 ring-[#c88b4b]/40 transition duration-125 hover:ring-2"
                        aria-label={`Open album ${album.album_id} in admin`}
                      >
                        <img
                          src={album.album?.cover_url || FALLBACK_COVER}
                          alt={album.album?.title || "Album"}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </a>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-white font-semibold truncate leading-tight">{album.album?.title || "Untitled album"}</p>
                        <p className="text-[12px] text-[#6f6f6f]">Album #{album.album_id}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <button
                            className="text-[12px] inline-flex items-center gap-1 rounded-[4px] bg-[rgba(255,255,255,0.06)] px-2 py-1 text-white hover:bg-[rgba(255,255,255,0.1)] transition duration-125"
                            onClick={() => copyToClipboard(absoluteUrl(album.magic_url), "Magic link copied")}
                          >
                            ✉️ Magic link
                          </button>
                          <a
                            href={`/proofing/${album.album_id}/client/${album.token}`}
                            className="text-[12px] inline-flex items-center gap-1 rounded-[4px] bg-[rgba(255,255,255,0.06)] px-2 py-1 text-[#c88b4b] hover:bg-[rgba(200,139,75,0.2)] transition duration-125"
                          >
                            ▶️ Open
                          </a>
                          <a
                            href={`/admin/albums/${album.album_id}`}
                            className="text-[12px] inline-flex items-center gap-1 rounded-[4px] bg-[rgba(255,255,255,0.06)] px-2 py-1 text-[#f2d3a4] hover:bg-[rgba(200,139,75,0.2)] transition duration-125"
                          >
                            🗂️ Admin album
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
      className={`px-3 py-1 rounded-[5px] transition duration-125 text-[13px] ${
        active
          ? "bg-[#c88b4b] text-black shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
          : "text-[#a4a4a4] hover:text-white hover:bg-[rgba(255,255,255,0.04)]"
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
