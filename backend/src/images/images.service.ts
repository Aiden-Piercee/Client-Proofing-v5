import { Injectable } from '@nestjs/common';
import { KokenService } from '../koken/koken.service';

@Injectable()
export class ImagesService {
  constructor(private readonly kokenService: KokenService) {}

  getImage(imageId: number) {
    return this.kokenService.getImageById(imageId);
  }
}
