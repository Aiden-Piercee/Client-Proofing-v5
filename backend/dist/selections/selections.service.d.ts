import { Pool } from 'mysql2/promise';
export type SelectionState = 'favorite' | 'approved' | 'rejected' | null;
export declare class SelectionsService {
    private readonly proofingDb;
    constructor(proofingDb: Pool);
    clearSelection(clientId: number, imageId: number): Promise<{
        clientId: number;
        imageId: number;
        state: null;
        print: boolean;
    }>;
    upsertSelection(clientId: number, imageId: number, state: SelectionState, print?: boolean): Promise<{
        clientId: number;
        imageId: number;
        state: any;
        print: boolean;
    }>;
    getSelectionsForClient(clientId: number): Promise<{
        imageId: any;
        state: SelectionState;
        print: boolean;
    }[]>;
}
