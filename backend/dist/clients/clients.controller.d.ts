import { ClientsService } from './clients.service';
import { LoginDto } from './dto/login.dto';
export declare class ClientsController {
    private readonly clientsService;
    constructor(clientsService: ClientsService);
    listClients(): Promise<import("./clients.service").ClientProfile[]>;
    getClient(id: number): Promise<import("./clients.service").ClientProfile | null>;
    login(body: LoginDto): Promise<{
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
}
