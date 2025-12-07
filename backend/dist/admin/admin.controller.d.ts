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
declare class GenerateTokenDto {
    album_id?: number;
    album_ids?: number[];
    client_id?: number;
    client_name?: string;
    email?: string;
}
declare class TokenParam {
    token: string;
}
declare class SessionParam {
    sessionId: string;
}
declare class UpdateSessionDto {
    album_id?: number;
    client_id?: number | null;
    client_name?: string | null;
    client_email?: string | null;
    token?: string | null;
}
declare class UpdateClientDto {
    name?: string;
    email?: string;
}
declare class ClientParam {
    clientId: string;
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
    listManagedTokens(): Promise<{
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
    listTokenResources(): Promise<{
        clients: {
            id: number;
            name: string | null;
            email: string | null;
        }[];
        albums: (import("mysql2").RowDataPacket & {
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
            tokens: {
                token: string;
                client_name: string | null;
                client_id: number | null;
                created_at: Date | string;
            }[];
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
    listClients(): Promise<{
        id: number;
        name: string | null;
        email: string | null;
        albums: {
            album_id: number;
            album: any;
            original_count: number;
            edited_count: number;
        }[];
        tokens: string[];
        original_total: number;
        edited_total: number;
    }[]>;
    generateManagedToken(body: GenerateTokenDto): Promise<{
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
    addAlbumToToken(params: TokenParam, body: {
        album_id?: number;
        album_ids?: number[];
    }): Promise<void | {
        token: string;
        album_id: number;
        client_id: number;
    }>;
    removeSession(params: SessionParam): Promise<{
        removed: boolean;
    }>;
    updateSession(params: SessionParam, body: UpdateSessionDto): Promise<{
        id: number;
        album_id: number;
        client_id: number | null;
        client_name: string | null;
        token: string;
        created_at: Date;
    }>;
    updateClient(params: ClientParam, body: UpdateClientDto): Promise<import("mysql2").RowDataPacket & {
        id: number;
        name: string | null;
        email: string | null;
    }>;
    updateSessionForHousekeeping(params: SessionParam, body: UpdateSessionDto): Promise<{
        id: number;
        album_id: number;
        client_id: number | null;
        client_name: string | null;
        token: string;
        created_at: Date;
    }>;
    deleteSessionForHousekeeping(params: SessionParam): Promise<{
        removed: boolean;
    }>;
    updateClientForHousekeeping(params: ClientParam, body: UpdateClientDto): Promise<import("mysql2").RowDataPacket & {
        id: number;
        name: string | null;
        email: string | null;
    }>;
    deleteClientForHousekeeping(params: ClientParam): Promise<{
        removed: boolean;
        client_id: number;
    }>;
}
export {};
