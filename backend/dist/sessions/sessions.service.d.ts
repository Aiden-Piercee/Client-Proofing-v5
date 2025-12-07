import { Pool } from 'mysql2/promise';
import { RowDataPacket } from 'mysql2';
import { EmailService } from '../email/email.service';
import { AlbumsService } from '../albums/albums.service';
export interface ClientSession extends RowDataPacket {
    id: number;
    album_id: number;
    client_id: number | null;
    token: string;
    client_name: string | null;
    email: string | null;
    expires_at: Date;
}
export declare class SessionsService {
    private proofDb;
    private readonly emailService;
    private readonly albumsService;
    private readonly logger;
    constructor(proofDb: Pool, emailService: EmailService, albumsService: AlbumsService);
    createAnonymousSession(albumId: number, clientName?: string | null): Promise<{
        album_id: number;
        token: string;
        client_id: number;
        client_name: string;
        magic_url: string;
    }>;
    createSession(albumId: number, email: string, clientName?: string): Promise<string>;
    sendMagicLink(albumId: number, email: string, clientName?: string, albumTitle?: string): Promise<{
        token: string;
        link: string;
    }>;
    attachEmailToSession(token: string, email: string, clientName?: string): Promise<ClientSession>;
    createSessionForClientId(albumId: number, clientId: number, clientName?: string | null, token?: string): Promise<{
        token: string;
        album_id: number;
        client_id: number;
    }>;
    addAlbumToExistingToken(token: string, albumId: number): Promise<{
        token: string;
        album_id: number;
        client_id: number;
    }>;
    validateSession(token: string): Promise<ClientSession>;
    assertSessionForAlbum(token: string, albumId: number): Promise<ClientSession>;
    getClientLanding(token: string): Promise<{
        client: {
            id: number;
            name: string | null;
            email: string | null;
        };
        sessions: {
            session_id: number;
            album_id: number;
            token: string;
            album: any;
            magic_url: string;
        }[];
        landing_url: string;
    }>;
    private getBaseUrl;
    private getValidSession;
    private ensureSessionAlbumLinkTable;
    private ensureClientForAnonymousSession;
    private buildPreviewAttachmentsForAlbum;
    private sendThankYouForSession;
    private safeSendThankYou;
    private ensureClient;
    findLatestTokenForClient(clientId: number): Promise<string | null>;
}
