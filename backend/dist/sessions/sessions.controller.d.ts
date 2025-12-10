import { SessionsService } from './sessions.service';
export declare class SessionsController {
    private service;
    constructor(service: SessionsService);
    createSession(body: any): Promise<{
        token: string;
        link: string;
    } | {
        token: string;
    }>;
    sendMagic(body: any): Promise<{
        token: string;
        link: string;
    }>;
    landing(token: string): Promise<{
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
    validate(token: string): Promise<import("./sessions.service").ClientSession>;
    attachEmail(token: string, body: {
        email: string;
        clientName?: string;
    }): Promise<import("./sessions.service").ClientSession>;
}
