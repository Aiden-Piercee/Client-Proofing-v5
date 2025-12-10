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
      <aside className="rounded-[6px] border border-[rgba(255,255,255,0.05)] bg-[#202020] p-3 text-[13px] text-[#a4a4a4] shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#6f6f6f]">Inspector</p>
            <p className="text-white font-semibold leading-tight">Collapsed</p>
          </div>
          <button
            onClick={onToggle}
            className="rounded-[5px] border border-[rgba(255,255,255,0.08)] bg-[#1f1f1f] px-3 py-2 text-[12px] text-white hover:bg-[#232323] transition duration-125"
          >
            Expand
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="rounded-[6px] border border-[rgba(255,255,255,0.05)] bg-[#202020] p-3 space-y-4 text-[13px] text-[#a4a4a4] shadow-[0_1px_2px_rgba(0,0,0,0.35)] max-h-[calc(100vh-220px)] overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#6f6f6f]">Inspector</p>
          <h3 className="text-[15px] font-semibold text-white leading-tight">Selected item</h3>
        </div>
        <button
          onClick={onToggle}
          className="rounded-[5px] border border-[rgba(255,255,255,0.08)] bg-[#1f1f1f] px-3 py-2 text-[12px] text-white hover:bg-[#232323] transition duration-125"
        >
          Collapse
        </button>
      </div>

      {!image && <p className="text-neutral-500">Select a thumbnail to inspect its metadata.</p>}

      {image && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[4px] border border-[rgba(255,255,255,0.08)] bg-[#1a1a1a] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <img
              src={image.large || image.medium || image.thumb || image.full || "/placeholder.svg"}
              alt={image.title || image.filename || "Selected image"}
              className="h-48 w-full object-cover"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-[12px] text-[#6f6f6f]">
            <InfoBlock label="Filename" value={image.filename || "—"} />
            <InfoBlock label="Dimensions" value={image.dimensions || "—"} />
            <InfoBlock label="ID" value={`#${image.id}`} />
            <InfoBlock label="Album" value={albumTitle || image.album_title || "—"} />
          </div>

          <div className="space-y-3">
            <label className="space-y-1 block">
              <span className="text-[11px] uppercase tracking-[0.18em] text-[#6f6f6f]">Title</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-9 rounded-[5px] border border-[rgba(255,255,255,0.08)] bg-[#1a1a1a] px-3 text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-[rgba(200,139,75,0.55)]"
              />
            </label>
            <label className="space-y-1 block">
              <span className="text-[11px] uppercase tracking-[0.18em] text-[#6f6f6f]">Caption</span>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full rounded-[5px] border border-[rgba(255,255,255,0.08)] bg-[#1a1a1a] px-3 py-2 text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-[rgba(200,139,75,0.55)]"
                rows={3}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[12px] text-[#6f6f6f]">
            <InfoBlock label="Visibility" value={visibility || "public"} />
            <InfoBlock label="License" value={license || "—"} />
            <InfoBlock label="Site" value={image.site || "—"} />
            <InfoBlock label="Download" value={download ? "Allowed" : "Disabled"} />
          </div>

          <div className="space-y-2">
            <label className="space-y-1 block">
              <span className="text-[11px] uppercase tracking-[0.18em] text-[#6f6f6f]">Categories</span>
              <input
                value={categories}
                onChange={(e) => setCategories(e.target.value)}
                className="w-full h-9 rounded-[5px] border border-[rgba(255,255,255,0.08)] bg-[#1a1a1a] px-3 text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-[rgba(200,139,75,0.55)]"
                placeholder="Comma separated"
              />
            </label>
            <label className="space-y-1 block">
              <span className="text-[11px] uppercase tracking-[0.18em] text-[#6f6f6f]">Tags</span>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full h-9 rounded-[5px] border border-[rgba(255,255,255,0.08)] bg-[#1a1a1a] px-3 text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-[rgba(200,139,75,0.55)]"
                placeholder="Comma separated"
              />
            </label>
          </div>

          <div className="flex items-center gap-3 text-[12px] text-[#6f6f6f]">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={download}
                onChange={(e) => setDownload(e.target.checked)}
                className="h-4 w-4 rounded border-[rgba(255,255,255,0.15)] bg-[#1a1a1a] text-[#c88b4b] focus:ring-[rgba(200,139,75,0.55)]"
              />
              <span>Allow download</span>
            </label>
            <label className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-[0.18em] text-[#6f6f6f]">Visibility</span>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="h-8 rounded-[4px] border border-[rgba(255,255,255,0.08)] bg-[#1a1a1a] px-2 text-[12px] text-white focus:outline-none focus:ring-1 focus:ring-[rgba(200,139,75,0.55)]"
              >
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
                <option value="private">Private</option>
              </select>
            </label>
          </div>

          <div className="rounded-[5px] border border-[rgba(255,255,255,0.08)] bg-[#1a1a1a]/80 p-3 space-y-1 text-[12px]">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#6f6f6f]">Direct link</p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={image.public_url || "Unavailable"}
                className="flex-1 h-8 rounded-[4px] border border-[rgba(255,255,255,0.08)] bg-[#101010] px-2 text-[11px] text-white"
              />
              <button
                onClick={() => navigator.clipboard.writeText(image.public_url || "")}
                className="rounded-[4px] border border-[rgba(255,255,255,0.08)] bg-[#1f1f1f] px-2 py-1 text-[11px] text-white hover:bg-[#232323] transition duration-125"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="space-y-2 text-[12px] text-[#6f6f6f]">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#6f6f6f]">History</p>
            <div className="grid grid-cols-2 gap-2">
              <InfoBlock label="Published" value={formatTimestamp(image.captured_on)} />
              <InfoBlock label="Captured" value={formatTimestamp(image.captured_on)} />
              <InfoBlock label="Uploaded" value={formatTimestamp(image.uploaded_on)} />
              <InfoBlock label="Modified" value={formatTimestamp(image.modified_on)} />
            </div>
          </div>

          {error && <p className="text-[13px] text-red-300">{error}</p>}
          {message && <p className="text-[13px] text-emerald-300">{message}</p>}

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
              className="flex-1 rounded-[5px] border border-[rgba(200,139,75,0.55)] bg-[rgba(200,139,75,0.25)] px-4 py-2 text-[13px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-[rgba(200,139,75,0.35)] transition duration-125 disabled:opacity-60 disabled:cursor-not-allowed"
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
              className="rounded-[5px] border border-[rgba(255,255,255,0.08)] bg-[#1f1f1f] px-4 py-2 text-[13px] text-white hover:bg-[#232323] transition duration-125 disabled:opacity-60 disabled:cursor-not-allowed"
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
    <div className="rounded-[4px] border border-[rgba(255,255,255,0.08)] bg-[#121212] px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.18em] text-[#6f6f6f]">{label}</p>
      <p className="text-white text-[12px] truncate leading-tight">{value || "—"}</p>
    </div>
  );
}
