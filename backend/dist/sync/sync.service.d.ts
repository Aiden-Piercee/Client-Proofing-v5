import { KokenService } from '../koken/koken.service';
export declare class SyncService {
    private readonly kokenService;
    constructor(kokenService: KokenService);
    markFavorite(imageId: number): Promise<{
        imageId: number;
        favorite: boolean;
    }>;
    removeFavorite(imageId: number): Promise<{
        imageId: number;
        favorite: boolean;
    }>;
}
