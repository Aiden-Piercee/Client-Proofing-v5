export interface Album {
  id: number;
  title: string | null;
  slug?: string;
  visibility?: number | string;
  created_on?: number;
  cover_id?: number | null;
  cover_url?: string | null;
}

export type SelectionState = "favorite" | "approved" | "rejected" | null;

export interface Image {
  id: number;
  title?: string | null;
  caption?: string | null;
  filename: string;
  internal_id: string;
  favorite: number;
  visibility: number | string;

  storage_path: string;
  thumb: string;
  thumb2x: string;
  tiny?: string | null;
  tiny2x?: string | null;
  small?: string | null;
  small2x?: string | null;
  medium?: string;
  medium2x?: string;
  large?: string;
  large2x?: string;
  full?: string;

  state?: SelectionState;
  edited?: Image | null;

  print?: boolean; // ✅ Added print flag
}

export interface SessionInfo {
  id: number;
  album_id: number;
  client_id: number;
  client_name: string;
  email?: string | null;
  expires_at: string | Date;
}

export interface SelectionPayload {
  sessionToken: string;
  imageId: number;

  state?: SelectionState; // already existed
  print?: boolean;        // ✅ NEW
}
