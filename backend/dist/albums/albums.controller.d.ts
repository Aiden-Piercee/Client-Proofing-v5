import { ConfigService } from '@nestjs/config';
import { AlbumsService } from './albums.service';
import { SessionsService } from '../sessions/sessions.service';
export declare class AlbumsController {
    private readonly albumsService;
    private readonly sessionService;
    private readonly configService;
    constructor(albumsService: AlbumsService, sessionService: SessionsService, configService: ConfigService);
    listAlbums(): Promise<(import("mysql2").RowDataPacket & {
        id: number;
        title: string | null;
        slug: string;
        visibility: number | string;
        created_on: number;
        cover_id: number | null;
    } & {
        cover_url: string;
    })[]>;
    getAlbum(id: number, sessionToken?: string): Promise<import("mysql2").RowDataPacket & {
        id: number;
        title: string | null;
        slug: string;
        visibility: number | string;
        created_on: number;
        cover_id: number | null;
    } & {
        cover_url: string;
    }>;
    getAlbumImages(id: number, sessionToken: string): Promise<(import("../koken/koken.service").KokenImageRow & {
        state: string | null;
        print: boolean;
        edited: any;
        isEditedReplacement?: boolean;
        original_image_id?: number | null;
        hasEditedReplacement?: boolean;
    })[]>;
}
