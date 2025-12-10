"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminClientSummary } from "@/lib/types";

const FALLBACK_COVER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="140" viewBox="0 0 200 140" fill="none"><rect width="200" height="140" rx="18" fill="#18181b"/><path d="M48 96l32-40 24 32 22-26 26 34H48z" fill="#27272a"/><circle cx="74" cy="56" r="12" fill="#3f3f46"/></svg>'
  );

type LoadState = "idle" | "loading" | "error";

export default function ClientListPage() {
  const [clients, setClients] = useState<AdminClientSummary[]>([]);
  const [state, setState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

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
    const load = async () => {
      setState("loading");
      setError(null);
      try {
        const API = process.env.NEXT_PUBLIC_API_URL;
        if (!API) throw new Error("NEXT_PUBLIC_API_URL missing");

        const token = localStorage.getItem("admin_token");
        if (!token) throw new Error("Missing admin token");

        const res = await fetch(`${API}/admin/clients`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Unable to load clients");
        const data: AdminClientSummary[] = await res.json();
        setClients(data);
        setState("idle");
      } catch (err: any) {
        console.error(err);
        setError(err.message);
        setState("error");
      }
    };

    load();
  }, []);

  const filteredClients = useMemo(() => {
    if (!query.trim()) return clients;
    const lower = query.toLowerCase();
    return clients.filter((client) =>
      (client.name ?? "").toLowerCase().includes(lower) ||
      (client.email ?? "").toLowerCase().includes(lower) ||
      String(client.id).includes(lower)
    );
  }, [clients, query]);

  if (state === "loading") return <p className="text-neutral-300">Loading clients…</p>;
  if (state === "error") return <p className="text-red-300">Error: {error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#6f6f6f] mb-1">Clients</p>
          <h1 className="text-[18px] font-semibold text-white leading-tight">Client list</h1>
          <p className="text-[#a4a4a4] mt-1 leading-relaxed">
            Human-friendly overview of every client, their galleries, and how many originals versus edits they hold.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#1f1f1f] border border-[rgba(255,255,255,0.08)] rounded-[6px] px-3 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, or ID"
            className="bg-transparent text-[13px] text-white placeholder:text-[#6f6f6f] focus:outline-none"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredClients.length === 0 && (
          <p className="text-[#a4a4a4]">No clients found.</p>
        )}

        {filteredClients.map((client) => {
          const albumCount = client.albums.length;
          const totalImages = client.original_total + client.edited_total;

          return (
            <div
              key={client.id}
              className="bg-[#1f1f1f] border border-[rgba(255,255,255,0.05)] rounded-[6px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.35)] space-y-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[#6f6f6f]">Client</p>
                  <h2 className="text-[17px] font-semibold text-white leading-tight">{client.name || "Unnamed client"}</h2>
                  <p className="text-[13px] text-[#a4a4a4]">ID: {client.id}</p>
                  <p className="text-[13px] text-[#a4a4a4] break-all">
                    {client.email ? (
                      <a href={`mailto:${client.email}`} className="hover:text-white underline decoration-[#c88b4b]">
                        {client.email}
                      </a>
                    ) : (
                      <span className="italic text-[#6f6f6f]">No email on file</span>
                    )}
                  </p>
                  {client.tokens.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {client.tokens.slice(0, 3).map((token) => (
                        <span
                          key={token}
                          className="inline-flex items-center gap-2 rounded-[5px] bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] px-3 py-1 text-[12px] text-white font-mono"
                        >
                          Token: {token.substring(0, 8)}…
                        </span>
                      ))}
                      {client.tokens.length > 3 && (
                        <span className="text-[12px] text-[#6f6f6f]">+{client.tokens.length - 3} more</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 text-right">
                  <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] rounded-[6px] px-3 py-2">
                    <div className="text-left">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[#6f6f6f]">Albums</p>
                      <p className="text-white font-semibold text-[16px]">{albumCount}</p>
                    </div>
                    <div className="h-10 w-px bg-[rgba(255,255,255,0.08)]" />
                    <div className="text-left">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[#6f6f6f]">Images</p>
                      <p className="text-white font-semibold text-[16px]">{totalImages}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-white">
                    <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[5px] bg-[rgba(34,197,94,0.12)] border border-[rgba(34,197,94,0.4)] text-emerald-100">
                      Originals: {client.original_total}
                    </span>
                    <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[5px] bg-[rgba(99,102,241,0.12)] border border-[rgba(99,102,241,0.35)] text-indigo-100">
                      -Edit: {client.edited_total}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#6f6f6f]">Assigned galleries</p>
                {client.albums.length === 0 && (
                  <p className="text-[#a4a4a4] text-[13px]">No galleries linked yet.</p>
                )}
                {client.albums.length > 0 && (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {client.albums.map((album) => {
                      const cover = absoluteUrl(album.album?.cover_url) || FALLBACK_COVER;
                      return (
                        <div
                          key={`${client.id}-${album.album_id}`}
                          className="group bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] rounded-[6px] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
                        >
                          <div className="aspect-[16/9] bg-[#0f0f0f] overflow-hidden">
                            <img
                              src={cover}
                              alt={album.album?.title || `Album ${album.album_id}`}
                              className="h-full w-full object-cover transition duration-150 group-hover:scale-[1.02]"
                              loading="lazy"
                            />
                          </div>
                          <div className="p-3 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-[13px] text-white font-semibold truncate leading-tight">
                                  {album.album?.title || "Untitled album"}
                                </p>
                                <p className="text-[12px] text-[#6f6f6f]">Album #{album.album_id}</p>
                              </div>
                              <div className="text-right text-[12px] text-[#a4a4a4] leading-tight">
                                <p>Originals: {album.original_count}</p>
                                <p>-Edit: {album.edited_count}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
