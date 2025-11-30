import { Pool } from 'mysql2/promise';
import { KokenService, KokenImageRow } from '../koken/koken.service';
export declare class AlbumsService {
    private readonly kokenService;
    private readonly proofingDb;
    constructor(kokenService: KokenService, proofingDb: Pool);
    listAlbums(): Promise<(import("mysql2/promise").RowDataPacket & {
        id: number;
        title: string | null;
        slug: string;
        visibility: number | string;
        created_on: number;
        cover_id: number | null;
    } & {
        cover_url: string;
    })[]>;
    getAlbum(id: number): Promise<import("mysql2/promise").RowDataPacket & {
        id: number;
        title: string | null;
        slug: string;
        visibility: number | string;
        created_on: number;
        cover_id: number | null;
    } & {
        cover_url: string;
    }>;
    listImagesForAlbum(albumId: number, clientId?: number): Promise<Array<KokenImageRow & {
        state: string | null;
        print: boolean;
        edited: any;
    }>>;
    getAllAlbumsWithCounts(): Promise<{
        session_count: any;
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
