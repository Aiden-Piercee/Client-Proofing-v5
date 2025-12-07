import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Pool } from 'mysql2/promise';
import { RowDataPacket } from 'mysql2';
import { SessionsService } from '../sessions/sessions.service';
import { AlbumsService } from '../albums/albums.service';
export declare class AdminService {
    private readonly configService;
    private readonly jwtService;
    private proofDb;
    private sessionsService;
    private albumsService;
    constructor(configService: ConfigService, jwtService: JwtService, proofDb: Pool, sessionsService: SessionsService, albumsService: AlbumsService);
    login(username: string, password: string): Promise<{
        token: string;
    }>;
    getAlbums(): Promise<(RowDataPacket & {
        id: number;
        title: string | null;
        slug: string;
        visibility: number | string;
        created_on: number;
        cover_id: number | null;
    } & {
        cover_url: string;
    })[]>;
    getAlbum(id: number): Promise<{
        images: {
            id: number;
            title: string | null;
            thumb: string | null;
            medium: string | null;
            large: string | null;
            full: string | null;
            filename: string | null;
            public_url: string | null;
            hasEditedReplacement: boolean;
            isEditedReplacement: boolean;
            original_image_id: number | null;
            selections: {
                client_id: number;
                client_name: string | null;
                email: string | null;
                state: string | null;
                print: boolean;
            }[];
        }[];
        sessions: RowDataPacket[];
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
    }>;
    createAnonymousSession(albumId: number): Promise<string>;
    listSessions(): Promise<{
        id: number;
        token: string;
        album_id: number;
        client_id: number | null;
        client_name: string | null;
        email: string | null;
        created_at: Date;
        album: any;
        landing_magic_url: string;
        client_albums: {
            session_id: number;
            album_id: number;
            token: string;
            album: any;
            magic_url: string;
        }[];
    }[]>;
    listClientsWithAlbums(): Promise<{
        id: number;
        name: string | null;
        email: string | null;
        albums: Array<{
            album_id: number;
            album: any;
            original_count: number;
            edited_count: number;
        }>;
        tokens: string[];
        original_total: number;
        edited_total: number;
    }[]>;
    generateManagedToken(options: {
        albumIds: number[];
        clientId?: number;
        clientName?: string | null;
        email?: string | null;
    }): Promise<{
        id: number;
        album_id: number;
        client_id: number | null;
        client_name: string | null;
        token: string;
        created_at: Date;
    } | {
        token: string;
        id?: undefined;
        album_id?: undefined;
        client_id?: undefined;
        client_name?: undefined;
        created_at?: undefined;
    }>;
    linkAlbumToSessionToken(token: string, albumId: number): Promise<{
        token: string;
        album_id: number;
        client_id: number;
    }>;
    linkAlbumsToSessionToken(token: string, albumIds: number[]): Promise<void>;
    removeSession(sessionId: number): Promise<{
        removed: boolean;
    }>;
    removeClient(clientId: number): Promise<{
        removed: boolean;
        client_id: number;
    }>;
    updateSessionDetails(sessionId: number, payload: {
        albumId?: number;
        clientId?: number | null;
        clientName?: string | null;
        clientEmail?: string | null;
        token?: string | null;
    }): Promise<{
        id: number;
        album_id: number;
        client_id: number | null;
        client_name: string | null;
        token: string;
        created_at: Date;
    }>;
    updateClientDetails(clientId: number, payload: {
        name?: string | null;
        email?: string | null;
    }): Promise<RowDataPacket & {
        id: number;
        name: string | null;
        email: string | null;
    }>;
    private getBaseUrl;
    listTokenResources(): Promise<{
        clients: {
            id: number;
            name: string | null;
            email: string | null;
        }[];
        albums: (RowDataPacket & {
            id: number;
            title: string | null;
            slug: string;
            visibility: number | string;
            created_on: number;
            cover_id: number | null;
        } & {
            cover_url: string;
        })[];
        albumSummaries: {
            album_id: number;
            album: any;
            tokens: Array<{
                token: string;
                client_name: string | null;
                client_id: number | null;
                created_at: Date | string;
            }>;
        }[];
    }>;
    listHousekeeping(): Promise<{
        clients: {
            id: number;
            name: string | null;
            email: string | null;
            created_at: Date;
        }[];
        sessions: {
            id: number;
            token: string;
            album_id: number;
            client_id: number | null;
            client_name: string | null;
            email: string | null;
            created_at: Date;
            album: any;
            landing_magic_url: string;
            client_albums: {
                session_id: number;
                album_id: number;
                token: string;
                album: any;
                magic_url: string;
            }[];
        }[];
    }>;
}
