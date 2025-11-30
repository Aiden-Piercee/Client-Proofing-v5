import { ImagesService } from './images.service';
export declare class ImagesController {
    private readonly imagesService;
    constructor(imagesService: ImagesService);
    getImage(id: number): Promise<import("../koken/koken.service").KokenImageRow>;
}
