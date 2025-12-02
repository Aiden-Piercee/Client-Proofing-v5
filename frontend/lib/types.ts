export interface Album {
  id: number;
  title: string | null;
  slug?: string;
  visibility?: number | string;
  created_on?: number;
  cover_id?: number | null;
  cover_url?: string | null;
  featured_image?: string | null;
  date?: string | Date | null;
}

export type SelectionState = "favorite" | "approved" | "rejected" | null;

export interface ImageSelectionSummary {
  client_id: number;
  client_name: string | null;
  email: string | null;
  state: SelectionState;
  print: boolean;
}

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

  selections?: ImageSelectionSummary[];

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

export interface ClientLandingAlbum {
  session_id: number;
  album_id: number;
  token: string;
  album: Album | null;
  magic_url: string;
}

export interface ClientLanding {
  client: {
    id: number;
    name: string | null;
    email: string | null;
  };
  sessions: ClientLandingAlbum[];
  landing_url: string;
}

export interface AdminSession {
  id: number;
  token: string;
  album_id: number;
  client_id: number | null;
  client_name: string | null;
  email: string | null;
  created_at: string | Date;
  album?: Album | null;
  landing_magic_url?: string;
  client_albums?: ClientLandingAlbum[];
}
