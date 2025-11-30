import { SyncService } from './sync.service';
export declare class SyncController {
    private readonly syncService;
    constructor(syncService: SyncService);
    favorite(imageId: number): Promise<{
        imageId: number;
        favorite: boolean;
    }>;
    unfavorite(imageId: number): Promise<{
        imageId: number;
        favorite: boolean;
    }>;
}
