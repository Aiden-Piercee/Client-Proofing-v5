export interface LibraryAlbum {
  id: number | string;
  title: string | null;
  image_count?: number | null;
  visibility?: number | string;
  created_on?: number | string;
  cover_url?: string | null;
  slug?: string | null;
}

export interface LibraryImage {
  id: number;
  title: string | null;
  caption?: string | null;
  thumb?: string | null;
  medium?: string | null;
  large?: string | null;
  full?: string | null;
  filename?: string | null;
  public_url?: string | null;
  favorite?: number | boolean;
  visibility?: number | string;
  captured_on?: number | string | null;
  modified_on?: number | string | null;
  uploaded_on?: number | string | null;
  dimensions?: string | null;
  categories?: string[];
  tags?: string[];
  license?: string | null;
  site?: string | null;
  download?: boolean;
  hasEditedReplacement?: boolean;
  isEditedReplacement?: boolean;
  original_image_id?: number | null;
  album_id?: number | null;
  album_title?: string | null;
  state?: string | null;
  print?: boolean;
}

export interface AlbumDetails extends LibraryAlbum {
  images: LibraryImage[];
}

export type FilterOption =
  | "content"
  | "lastImport"
  | "favorites"
  | "featured"
  | "quick"
  | "unlisted"
  | "private"
  | "year";

export interface LibraryContext {
  scope: "all" | "album";
  filter: FilterOption;
  albumId?: number | null;
  year?: number | null;
  label?: string;
}

export interface MetadataUpdatePayload {
  title?: string;
  caption?: string;
  license?: string;
  visibility?: string;
  categories?: string[];
  tags?: string[];
  download?: boolean;
}
