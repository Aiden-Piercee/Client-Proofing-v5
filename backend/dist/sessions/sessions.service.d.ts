import { Pool, RowDataPacket } from 'mysql2/promise';
import { EmailService } from '../email/email.service';
export interface ClientSession extends RowDataPacket {
    id: number;
    album_id: number;
    client_id: number | null;
    token: string;
    client_name: string;
    email: string | null;
    expires_at: Date;
}
export declare class SessionsService {
    private proofDb;
    private readonly emailService;
    constructor(proofDb: Pool, emailService: EmailService);
    createAnonymousSession(albumId: number): Promise<{
        album_id: number;
        token: string;
        magic_url: string;
    }>;
    createSession(albumId: number, email: string, clientName?: string): Promise<string>;
    sendMagicLink(albumId: number, email: string, clientName?: string, albumTitle?: string): Promise<{
        token: string;
        link: string;
    }>;
    validateSession(token: string): Promise<ClientSession>;
    assertSessionForAlbum(token: string, albumId: number): Promise<ClientSession>;
    private getValidSession;
    private ensureClient;
}
