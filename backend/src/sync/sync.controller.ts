import { Body, Controller, ParseIntPipe, Post } from '@nestjs/common';
import { SyncService } from './sync.service';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('koken/favorite')
  favorite(@Body('imageId', ParseIntPipe) imageId: number) {
    return this.syncService.markFavorite(imageId);
  }

  @Post('koken/unfavorite')
  unfavorite(@Body('imageId', ParseIntPipe) imageId: number) {
    return this.syncService.removeFavorite(imageId);
  }
}
