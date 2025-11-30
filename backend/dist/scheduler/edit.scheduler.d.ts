import { Pool } from 'mysql2/promise';
export declare class EditScheduler {
    private readonly kokenDb;
    private readonly logger;
    constructor(kokenDb: Pool);
    detectEditedImages(): Promise<void>;
}
