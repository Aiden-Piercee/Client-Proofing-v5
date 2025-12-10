import { RowDataPacket } from 'mysql2';
import { Pool } from 'mysql2/promise';
export interface KokenImageRow {
    id: number;
    title: string | null;
    caption: string | null;
    filename: string;
    internal_id: string;
    favorite: number;
    visibility: number | string;
    modified_on: number;
    captured_on: number;
    thumb?: string | null;
    thumb2x?: string | null;
    medium?: string | null;
    medium2x?: string | null;
    large?: string | null;
    large2x?: string | null;
    full?: string | null;
    storage_path?: string | null;
}
type AlbumRow = RowDataPacket & {
    id: number;
    title: string | null;
    slug: string;
    visibility: number | string;
    created_on: number;
    cover_id: number | null;
};
type EnrichedAlbum = AlbumRow & {
    cover_url: string;
};
export declare class KokenService {
    private readonly kokenDb;
    constructor(kokenDb: Pool);
    private neutralPlaceholder;
    private enrichAlbumCovers;
    listAlbums(): Promise<EnrichedAlbum[]>;
    getAlbumById(id: number): Promise<EnrichedAlbum>;
    private fetchKokenImage;
    private buildStoragePath;
    private enrichPresets;
    listImagesForAlbum(albumId: number): Promise<KokenImageRow[]>;
    getImageById(imageId: number): Promise<KokenImageRow>;
    writeFavoriteToKoken(imageId: number): Promise<void>;
    removeFavoriteFromKoken(imageId: number): Promise<void>;
}
export {};
