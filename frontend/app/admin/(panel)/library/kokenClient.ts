import { AlbumDetails, LibraryAlbum, LibraryContext, LibraryImage, MetadataUpdatePayload } from "./types";

function assertEnvApi() {
  const api = process.env.NEXT_PUBLIC_KOKEN_API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!api) {
    throw new Error("NEXT_PUBLIC_KOKEN_API_URL or NEXT_PUBLIC_API_URL missing");
  }
  return api.replace(/\/$/, "");
}

function getToken() {
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
  if (!token) {
    throw new Error("Missing admin token");
  }
  return token;
}

async function authorizedRequest<T>(path: string, init?: RequestInit) {
  const API = assertEnvApi();
  const token = getToken();

  const safePath = path.startsWith("/") ? path : `/${path}`;
  const res = await fetch(`${API}${safePath}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request to ${path} failed`);
  }

  return (await res.json()) as T;
}

export async function fetchAlbums(): Promise<LibraryAlbum[]> {
  const payload = await authorizedRequest<{ albums?: LibraryAlbum[]; data?: LibraryAlbum[] } | LibraryAlbum[]>("/albums");
  const list = Array.isArray(payload) ? payload : payload.albums || payload.data || [];
  return list.map((album) => ({
    ...album,
    cover_url: normalizeAsset(album.cover_url || (album as any).cover?.url || null),
  }));
}

export async function fetchAlbumWithImages(id: number): Promise<AlbumDetails> {
  const [meta, content] = await Promise.all([
    authorizedRequest<LibraryAlbum>(`/albums/${id}`),
    authorizedRequest<{ content?: LibraryImage[]; data?: LibraryImage[]; items?: LibraryImage[] } | LibraryImage[]>(
      `/albums/${id}/content`
    ),
  ]);

  const imagesRaw = Array.isArray(content) ? content : content.content || content.data || content.items || [];
  const normalizedImages = imagesRaw.map((img) => normalizeImage(img, meta, id));

  return {
    ...meta,
    cover_url: normalizeAsset(meta.cover_url || (meta as any).cover?.url || null),
    image_count: meta.image_count ?? normalizedImages.length,
    images: normalizedImages,
  };
}

export async function fetchGlobalContent(): Promise<LibraryImage[]> {
  const payload = await authorizedRequest<{ content?: LibraryImage[]; data?: LibraryImage[] } | LibraryImage[]>(
    "/content"
  );
  const list = Array.isArray(payload) ? payload : payload.content || payload.data || [];
  return list.map((img) => normalizeImage(img));
}

function normalizeAsset(url?: string | null) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const base = assertEnvApi();
  const cleaned = url.startsWith("/") ? url.slice(1) : url;
  return `${base}/${cleaned}`;
}

function normalizeImage(img: LibraryImage, album?: LibraryAlbum, fallbackAlbumId?: number): LibraryImage {
  const thumb =
    img.thumb ||
    (img as any).presets?.square?.url ||
    (img as any).presets?.medium?.url ||
    img.public_url ||
    img.filename ||
    null;
  const medium = img.medium || (img as any).presets?.medium?.url || thumb;
  const large = img.large || (img as any).presets?.large?.url || img.full || medium;
  const full = img.full || (img as any).original || img.public_url || large;

  return {
    ...img,
    thumb: normalizeAsset(thumb),
    medium: normalizeAsset(medium),
    large: normalizeAsset(large),
    full: normalizeAsset(full),
    public_url: normalizeAsset(img.public_url || null),
    album_id: img.album_id ?? fallbackAlbumId ?? null,
    album_title: img.album_title ?? album?.title ?? null,
  };
}

function resolveWriteBase() {
  const adminBase = process.env.NEXT_PUBLIC_KOKEN_API_URL;
  if (adminBase) return adminBase.replace(/\/$/, "");
  const api = process.env.NEXT_PUBLIC_API_URL;
  return api ? `${api.replace(/\/$/, "")}/content` : null;
}

export async function updateContentMetadata(id: number, payload: MetadataUpdatePayload) {
  const base = resolveWriteBase();
  if (!base) {
    throw new Error("Koken write API is not configured");
  }
  const token = getToken();
  const res = await fetch(`${base}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Unable to update content metadata");
  }

  return res.json();
}

export async function updateContentCategories(id: number, categories: string[]) {
  const base = resolveWriteBase();
  if (!base) {
    throw new Error("Koken write API is not configured");
  }
  const token = getToken();
  const res = await fetch(`${base}/${id}/categories`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ categories }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Unable to update categories");
  }

  return res.json();
}

export async function updateContentTags(id: number, tags: string[]) {
  const base = resolveWriteBase();
  if (!base) {
    throw new Error("Koken write API is not configured");
  }
  const token = getToken();
  const res = await fetch(`${base}/${id}/tags`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ tags }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Unable to update tags");
  }

  return res.json();
}

export function contextLabel(context: LibraryContext) {
  if (context.scope === "album" && context.albumId) {
    return context.label ?? "Album";
  }
  if (context.filter === "year" && context.year) {
    return `${context.year}`;
  }
  const map: Record<LibraryContext["filter"], string> = {
    content: "Content",
    lastImport: "Last import",
    favorites: "Favorites",
    featured: "Featured",
    quick: "Quick collection",
    unlisted: "Unlisted",
    private: "Private",
    year: "Date published",
  };
  return map[context.filter];
}
