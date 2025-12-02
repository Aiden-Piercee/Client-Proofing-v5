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
            public_url: string | null;
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
    listSessions(): Promise<RowDataPacket[]>;
}
