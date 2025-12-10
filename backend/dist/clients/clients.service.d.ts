import { Pool } from 'mysql2/promise';
import { RowDataPacket } from 'mysql2';
export interface ClientRecord extends RowDataPacket {
    id: number;
    name: string;
    email: string;
    access_code: string;
}
export interface ClientProfile {
    id: number;
    name: string;
    email: string;
}
export interface SessionRecord {
    token: string;
    client_id: number;
    expires_at: Date;
}
export declare class ClientsService {
    private readonly proofingDb;
    private readonly sessionTtlSeconds;
    constructor(proofingDb: Pool);
    listClients(): Promise<ClientProfile[]>;
    getClient(id: number): Promise<ClientProfile | null>;
    login(email: string, accessCode: string): Promise<{
        client: {
            id: number;
            name: string;
            email: string;
        };
        session: {
            token: string;
            expiresAt: string;
        };
    }>;
    logout(token: string): Promise<{
        removed: number;
    }>;
    validateSession(token: string): Promise<{
        token: any;
        expiresAt: Date;
        client: {
            id: number;
            name: string;
            email: string;
        };
    } | null>;
    private findClientByEmail;
    private isAccessCodeValid;
    private createSession;
    private removeExpiredSessions;
}
