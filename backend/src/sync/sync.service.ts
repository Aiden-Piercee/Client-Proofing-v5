import { Injectable } from '@nestjs/common';
import { KokenService } from '../koken/koken.service';

@Injectable()
export class SyncService {
  constructor(private readonly kokenService: KokenService) {}

  async markFavorite(imageId: number) {
    await this.kokenService.writeFavoriteToKoken(imageId);
    return { imageId, favorite: true };
  }

  async removeFavorite(imageId: number) {
    await this.kokenService.removeFavoriteFromKoken(imageId);
    return { imageId, favorite: false };
  }
}
