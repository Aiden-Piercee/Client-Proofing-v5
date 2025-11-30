import { AdminService } from './admin.service';
declare class LoginDto {
    username: string;
    password: string;
}
declare class AlbumIdParam {
    id: string;
}
declare class CreateSessionDto {
    album_id: number;
}
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    login(body: LoginDto): Promise<{
        token: string;
    }>;
    getAlbums(): Promise<(import("mysql2").RowDataPacket & {
        id: number;
        title: string | null;
        slug: string;
        visibility: number | string;
        created_on: number;
        cover_id: number | null;
    } & {
        cover_url: string;
    })[]>;
    getAlbum(params: AlbumIdParam): Promise<{
        images: {
            id: number;
            title: string | null;
            thumb: string | null;
            medium: string | null;
            large: string | null;
            full: string | null;
            public_url: string | null;
        }[];
        sessions: import("mysql2").RowDataPacket[];
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
    createSession(body: CreateSessionDto): Promise<string>;
    listSessions(): Promise<import("mysql2").RowDataPacket[]>;
}
export {};
