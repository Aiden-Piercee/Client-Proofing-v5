import { Album, Image, SessionInfo, SelectionPayload } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3700";

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

async function apiPost<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json();
}

// ---- Sessions ----
export function validateSession(token: string): Promise<SessionInfo> {
  return apiGet(`/client/session/${token}`);
}

// ---- Album list ----
export function getAlbums(): Promise<Album[]> {
  return apiGet("/albums");
}

// ---- Album ----
export function getAlbum(albumId: number): Promise<Album> {
  return apiGet(`/albums/${albumId}`);
}

export function getAlbumImages(albumId: number, sessionToken: string): Promise<Image[]> {
  return apiGet(`/albums/${albumId}/images?sessionToken=${sessionToken}`);
}

// ---- Selections ----
export function sendSelection(payload: SelectionPayload) {
  return apiPost(`/selections/${payload.sessionToken}/${payload.imageId}`, {
    state: payload.state,
    print: payload.print, // ✅ send print to backend
  });
}

// ---- Sync favorite directly into Koken ----
export function syncFavoriteToKoken(imageId: number) {
  return apiPost(`/sync/koken/${imageId}`, {});
}
