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
          <p className="text-xs uppercase tracking-[0.25em] text-neutral-400 mb-2">Clients</p>
          <h1 className="text-3xl font-semibold text-white">Client list</h1>
          <p className="text-neutral-400 mt-1">
            Human-friendly overview of every client, their galleries, and how many originals versus edits they hold.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, or ID"
            className="bg-transparent text-sm text-white placeholder:text-neutral-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredClients.length === 0 && (
          <p className="text-neutral-400">No clients found.</p>
        )}

        {filteredClients.map((client) => {
          const albumCount = client.albums.length;
          const totalImages = client.original_total + client.edited_total;

          return (
            <div
              key={client.id}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/20 space-y-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.25em] text-neutral-400">Client</p>
                  <h2 className="text-2xl font-semibold text-white">{client.name || "Unnamed client"}</h2>
                  <p className="text-sm text-neutral-300">ID: {client.id}</p>
                  <p className="text-sm text-neutral-300 break-all">
                    {client.email ? (
                      <a href={`mailto:${client.email}`} className="hover:text-white underline">
                        {client.email}
                      </a>
                    ) : (
                      <span className="italic text-neutral-500">No email on file</span>
                    )}
                  </p>
                  {client.tokens.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {client.tokens.slice(0, 3).map((token) => (
                        <span
                          key={token}
                          className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs text-white font-mono"
                        >
                          Token: {token.substring(0, 8)}…
                        </span>
                      ))}
                      {client.tokens.length > 3 && (
                        <span className="text-xs text-neutral-400">+{client.tokens.length - 3} more</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 text-right">
                  <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-3 py-2">
                    <div className="text-left">
                      <p className="text-xs uppercase tracking-[0.2em] text-neutral-300">Albums</p>
                      <p className="text-white font-semibold text-lg">{albumCount}</p>
                    </div>
                    <div className="h-10 w-px bg-white/10" />
                    <div className="text-left">
                      <p className="text-xs uppercase tracking-[0.2em] text-neutral-300">Images</p>
                      <p className="text-white font-semibold text-lg">{totalImages}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-200">
                    <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-300/30 text-emerald-100">
                      Originals: {client.original_total}
                    </span>
                    <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-300/30 text-indigo-100">
                      -Edit: {client.edited_total}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Assigned galleries</p>
                {client.albums.length === 0 && (
                  <p className="text-neutral-400 text-sm">No galleries linked yet.</p>
                )}
                {client.albums.length > 0 && (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {client.albums.map((album) => {
                      const cover = absoluteUrl(album.album?.cover_url) || FALLBACK_COVER;
                      return (
                        <div
                          key={`${client.id}-${album.album_id}`}
                          className="group bg-white/5 border border-white/10 rounded-xl overflow-hidden shadow-md shadow-black/20"
                        >
                          <div className="aspect-[16/9] bg-neutral-900 overflow-hidden">
                            <img
                              src={cover}
                              alt={album.album?.title || `Album ${album.album_id}`}
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                              loading="lazy"
                            />
                          </div>
                          <div className="p-3 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm text-white font-semibold truncate">
                                  {album.album?.title || "Untitled album"}
                                </p>
                                <p className="text-xs text-neutral-400">Album #{album.album_id}</p>
                              </div>
                              <div className="text-right text-xs text-neutral-300">
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
