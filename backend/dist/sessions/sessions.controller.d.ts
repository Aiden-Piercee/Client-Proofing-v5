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
    validate(token: string): Promise<import("./sessions.service").ClientSession>;
}
