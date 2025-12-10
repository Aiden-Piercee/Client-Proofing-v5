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
  medium?: string;
  medium2x?: string;
  large?: string;
  full?: string;

  state?: SelectionState;
}

export interface SelectionPayload {
  sessionToken: string;
  imageId: number;
  state: SelectionState;
}
