"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ImageSelectionSummary, SelectionState } from "@/lib/types";

interface Session {
  id: number;
  token: string;
  email: string | null;
  created_at: string;
}

interface Album {
  id: number;
  title: string;
  images: AlbumImage[];
  sessions: Session[];
  cover_url?: string | null;
  featured_image?: string | null;
  image_count?: number | null;
}

interface AlbumImage {
  id: number;
  title?: string | null;
  public_url?: string | null;
  selections?: ImageSelectionSummary[];
  filename?: string | null;
  hasEditedReplacement?: boolean;
  isEditedReplacement?: boolean;
  original_image_id?: number | null;
}

export default function AdminAlbumDetailPage() {
  const params = useParams();
  const albumId = Number(params.albumId);

  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markedFilenames, setMarkedFilenames] = useState<string>("");

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

  const generateMarkedFilenames = async () => {
    if (!album) return;

    const filenames = (album.images ?? [])
      .filter((img) => img.selections?.some((sel) => !!sel.state || sel.print))
      .map((img) => img.filename)
      .filter((name): name is string => !!name && name.trim().length > 0)
      .map((name) => name.replace(/\.jpe?g$/i, ""));

    if (filenames.length === 0) {
      setMarkedFilenames("");
      alert("No marked images found for this gallery yet.");
      return;
    }

    setMarkedFilenames(filenames.join(", "));
  };

  const copyMarkedFilenames = async () => {
    if (!markedFilenames) return;
    try {
      await navigator.clipboard.writeText(markedFilenames);
      alert("Filenames copied to clipboard");
    } catch (err) {
      console.error(err);
      alert("Unable to copy filenames");
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
              loading="lazy"
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
        <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <p className="text-sm text-neutral-200">Generate Lightroom-compatible filename list for marked images.</p>
            <div className="flex flex-wrap gap-2">
              <button
                className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold px-3 py-2 rounded-lg shadow-md shadow-black/30 disabled:opacity-60"
                onClick={generateMarkedFilenames}
                disabled={loading}
              >
                Build filename list
              </button>
              <button
                className="border border-white/20 text-white rounded-lg px-3 py-2 text-sm hover:border-white/40 disabled:opacity-60"
                onClick={copyMarkedFilenames}
                disabled={!markedFilenames}
              >
                Copy
              </button>
            </div>
          </div>
          <textarea
            className="w-full rounded-lg bg-black/40 border border-white/10 text-white text-sm p-3 min-h-[80px]"
            readOnly
            value={markedFilenames}
            placeholder="Marked filenames will appear here after generation"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-300">
          <LegendPill tone="bg-pink-500/20" border="border-pink-400/40" label="❤️ Favorite" />
          <LegendPill tone="bg-emerald-500/20" border="border-emerald-400/40" label="✔️ Approved" />
          <LegendPill tone="bg-red-500/20" border="border-red-400/40" label="❌ Rejected" />
          <LegendPill tone="bg-amber-500/20" border="border-amber-300/40" label="🖨️ Print requested" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {album.images?.map((img) => (
            <div
              key={img.id}
              className="group relative rounded-2xl overflow-hidden border border-white/10 bg-white/5 shadow-lg shadow-black/20"
            >
              <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
                {img.hasEditedReplacement ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/80 px-3 py-1 text-xs font-semibold text-white shadow">
                    ✨ Edited uploaded
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/80 px-3 py-1 text-xs font-semibold text-white shadow">
                    ⏳ Pending edit
                  </span>
                )}
              </div>
              <img src={img.public_url || ""} alt="" className="w-full h-full object-cover aspect-[4/3]" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition" />
              <div className="absolute inset-x-3 bottom-3 space-y-1 text-xs">
                {img.selections && img.selections.length > 0 ? (
                  latestSelections(img.selections).map((sel, idx) => (
                    <div
                      key={`${img.id}-${sel.client_id}-${sel.state}-${idx}`}
                      className="flex items-center gap-2 rounded-xl bg-black/60 px-3 py-2 backdrop-blur"
                    >
                      <span className={`${badgeTone(sel.state)} text-white px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1`}>
                        {stateIcon(sel.state)} {stateLabel(sel.state)}
                      </span>
                      <span className="text-neutral-200 truncate">
                        {sel.client_name || sel.email || "Client"}
                      </span>
                      {sel.print && (
                        <span className="ml-auto text-amber-200 text-[11px] bg-amber-600/30 border border-amber-300/40 px-2 py-1 rounded-lg">
                          🖨️ Print
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-neutral-200">
                    No selections yet
                  </span>
                )}
              </div>
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

function stateLabel(state: SelectionState | null) {
  if (state === "favorite") return "Favorite";
  if (state === "approved") return "Approved";
  if (state === "rejected") return "Rejected";
  return "No state";
}

function stateIcon(state: SelectionState | null) {
  if (state === "favorite") return "❤️";
  if (state === "approved") return "✔️";
  if (state === "rejected") return "❌";
  return "•";
}

function badgeTone(state: SelectionState | null) {
  if (state === "favorite") return "bg-pink-500/30 border border-pink-300/40";
  if (state === "approved") return "bg-emerald-500/30 border border-emerald-300/40";
  if (state === "rejected") return "bg-red-600/40 border border-red-300/40";
  return "bg-white/20 border border-white/30";
}

function latestSelections(selections: ImageSelectionSummary[]) {
  const seen = new Set<string>();
  const latest: ImageSelectionSummary[] = [];

  selections.forEach((sel, index) => {
    const key =
      sel.client_id !== null && sel.client_id !== undefined
        ? `client-${sel.client_id}`
        : sel.email
          ? `email-${sel.email.toLowerCase()}`
          : `fallback-${index}`;

    if (seen.has(key)) return;

    seen.add(key);
    latest.push(sel);
  });

  return latest;
}

function LegendPill({ tone, border, label }: { tone: string; border: string; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-medium ${tone} ${border} text-white/90 backdrop-blur`}
    >
      {label}
    </span>
  );
}
