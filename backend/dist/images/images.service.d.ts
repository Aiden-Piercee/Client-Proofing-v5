import { KokenService } from '../koken/koken.service';
export declare class ImagesService {
    private readonly kokenService;
    constructor(kokenService: KokenService);
    getImage(imageId: number): Promise<import("../koken/koken.service").KokenImageRow>;
}
