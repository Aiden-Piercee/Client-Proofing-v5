import { Pool } from 'mysql2/promise';
import { RowDataPacket } from 'mysql2';
import { KokenService, KokenImageRow } from '../koken/koken.service';
type AlbumImage = KokenImageRow & {
    state: string | null;
    print: boolean;
    edited: any;
    isEditedReplacement?: boolean;
    original_image_id?: number | null;
    hasEditedReplacement?: boolean;
};
interface ListImageOptions {
    hideOriginalsWithEdits?: boolean;
}
export declare class AlbumsService {
    private readonly kokenService;
    private readonly proofingDb;
    constructor(kokenService: KokenService, proofingDb: Pool);
    listAlbums(): Promise<(RowDataPacket & {
        id: number;
        title: string | null;
        slug: string;
        visibility: number | string;
        created_on: number;
        cover_id: number | null;
    } & {
        cover_url: string;
    })[]>;
    getAlbum(id: number): Promise<RowDataPacket & {
        id: number;
        title: string | null;
        slug: string;
        visibility: number | string;
        created_on: number;
        cover_id: number | null;
    } & {
        cover_url: string;
    }>;
    listImagesForAlbum(albumId: number, clientId?: number, options?: ListImageOptions): Promise<AlbumImage[]>;
    getAllAlbumsWithCounts(): Promise<{
        session_count: number;
        constructor: {
            name: "RowDataPacket";
        };
        id: number;
        title: string | null;
        slug: string;
        visibility: number | string;
        created_on: number;
        cover_id: number | null;
        cover_url: string;
    }[]>;
}
export {};
