"use client";

import { useEffect, useState } from "react";
import { LibraryImage } from "./types";

interface InspectorPanelProps {
  image: LibraryImage | null;
  albumTitle?: string | null;
  collapsed: boolean;
  onToggle: () => void;
  onSave: (payload: {
    title: string;
    caption: string;
    license: string;
    visibility: string;
    categories: string[];
    tags: string[];
    download: boolean;
  }) => Promise<void>;
  saving: boolean;
  error?: string | null;
}

function formatTimestamp(value?: number | string | null) {
  if (!value && value !== 0) return "";
  const numeric = typeof value === "string" ? Number(value) : value;
  if (!numeric) return "";
  const date = new Date(numeric * 1000);
  return date.toLocaleString();
}

export function InspectorPanel({
  image,
  albumTitle,
  collapsed,
  onToggle,
  onSave,
  saving,
  error,
}: InspectorPanelProps) {
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [license, setLicense] = useState("All rights reserved");
  const [visibility, setVisibility] = useState("public");
  const [categories, setCategories] = useState("");
  const [tags, setTags] = useState("");
  const [download, setDownload] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setMessage(null);
    if (!image) return;
    setTitle(image.title || image.filename || "");
    setCaption(image.caption || "");
    setLicense(image.license || "All rights reserved");
    setVisibility(String(image.visibility ?? "public"));
    setCategories((image.categories ?? []).join(", "));
    setTags((image.tags ?? []).join(", "));
    setDownload(image.download ?? true);
  }, [image]);

  if (collapsed) {
    return (
      <aside className="rounded-2xl border border-white/10 bg-neutral-900/70 p-4 text-sm text-neutral-300 shadow-lg shadow-black/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">Inspector</p>
            <p className="text-white font-semibold">Collapsed</p>
          </div>
          <button
            onClick={onToggle}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white hover:bg-white/10 transition"
          >
            Expand
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="rounded-2xl border border-white/10 bg-neutral-900/70 p-4 space-y-4 text-sm text-neutral-300 shadow-xl shadow-black/30 max-h-[calc(100vh-220px)] overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">Inspector</p>
          <h3 className="text-lg font-semibold text-white">Selected item</h3>
        </div>
        <button
          onClick={onToggle}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white hover:bg-white/10 transition"
        >
          Collapse
        </button>
      </div>

      {!image && <p className="text-neutral-500">Select a thumbnail to inspect its metadata.</p>}

      {image && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-neutral-800">
            <img
              src={image.large || image.medium || image.thumb || image.full || "/placeholder.svg"}
              alt={image.title || image.filename || "Selected image"}
              className="h-48 w-full object-cover"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-neutral-400">
            <InfoBlock label="Filename" value={image.filename || "—"} />
            <InfoBlock label="Dimensions" value={image.dimensions || "—"} />
            <InfoBlock label="ID" value={`#${image.id}`} />
            <InfoBlock label="Album" value={albumTitle || image.album_title || "—"} />
          </div>

          <div className="space-y-3">
            <label className="space-y-1 block">
              <span className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">Title</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </label>
            <label className="space-y-1 block">
              <span className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">Caption</span>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                rows={3}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-neutral-400">
            <InfoBlock label="Visibility" value={visibility || "public"} />
            <InfoBlock label="License" value={license || "—"} />
            <InfoBlock label="Site" value={image.site || "—"} />
            <InfoBlock label="Download" value={download ? "Allowed" : "Disabled"} />
          </div>

          <div className="space-y-2">
            <label className="space-y-1 block">
              <span className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">Categories</span>
              <input
                value={categories}
                onChange={(e) => setCategories(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                placeholder="Comma separated"
              />
            </label>
            <label className="space-y-1 block">
              <span className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">Tags</span>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                placeholder="Comma separated"
              />
            </label>
          </div>

          <div className="flex items-center gap-3 text-xs text-neutral-400">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={download}
                onChange={(e) => setDownload(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-neutral-800 text-amber-400 focus:ring-amber-500/60"
              />
              <span>Allow download</span>
            </label>
            <label className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">Visibility</span>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="rounded border border-white/10 bg-neutral-800 px-2 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              >
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
                <option value="private">Private</option>
              </select>
            </label>
          </div>

          <div className="rounded-xl border border-white/10 bg-neutral-800/70 p-3 space-y-1 text-xs">
            <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">Direct link</p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={image.public_url || "Unavailable"}
                className="flex-1 rounded-lg border border-white/10 bg-neutral-900 px-2 py-1 text-[11px] text-white"
              />
              <button
                onClick={() => navigator.clipboard.writeText(image.public_url || "")}
                className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white hover:bg-white/10 transition"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="space-y-2 text-xs text-neutral-400">
            <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">History</p>
            <div className="grid grid-cols-2 gap-2">
              <InfoBlock label="Published" value={formatTimestamp(image.captured_on)} />
              <InfoBlock label="Captured" value={formatTimestamp(image.captured_on)} />
              <InfoBlock label="Uploaded" value={formatTimestamp(image.uploaded_on)} />
              <InfoBlock label="Modified" value={formatTimestamp(image.modified_on)} />
            </div>
          </div>

          {error && <p className="text-sm text-red-300">{error}</p>}
          {message && <p className="text-sm text-emerald-300">{message}</p>}

          <div className="flex items-center justify-between gap-2">
            <button
              onClick={async () => {
                if (!image) return;
                await onSave({
                  title,
                  caption,
                  license,
                  visibility,
                  categories: categories
                    .split(",")
                    .map((c) => c.trim())
                    .filter(Boolean),
                  tags: tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                  download,
                });
                setMessage("Metadata saved to Koken.");
              }}
              disabled={!image || saving}
              className="flex-1 rounded-lg border border-amber-500/40 bg-amber-600/40 px-4 py-2 text-sm font-semibold text-white shadow-inner shadow-amber-900/40 hover:bg-amber-500/50 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => {
                setTitle(image?.title || image?.filename || "");
                setCaption(image?.caption || "");
                setLicense(image?.license || "All rights reserved");
                setVisibility(String(image?.visibility ?? "public"));
                setCategories((image?.categories ?? []).join(", "));
                setTags((image?.tags ?? []).join(", "));
                setDownload(image?.download ?? true);
                setMessage(null);
              }}
              disabled={!image || saving}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-neutral-900 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-500">{label}</p>
      <p className="text-white text-xs truncate">{value || "—"}</p>
    </div>
  );
}
