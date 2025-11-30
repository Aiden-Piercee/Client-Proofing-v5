import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { AlbumsService } from './albums.service';
import { SessionsService } from '../sessions/sessions.service';

@Controller('albums')
export class AlbumsController {
  constructor(
    private readonly albumsService: AlbumsService,
    private readonly sessionService: SessionsService
  ) {}

  @Get()
  listAlbums() {
    return this.albumsService.listAlbums();
  }

  @Get(':id')
  getAlbum(@Param('id', ParseIntPipe) id: number) {
    return this.albumsService.getAlbum(id);
  }

  @Get(':id/images')
  async getAlbumImages(
    @Param('id', ParseIntPipe) id: number,
    @Query('sessionToken') sessionToken: string
  ) {
    const session = await this.sessionService.assertSessionForAlbum(sessionToken, id);
    return this.albumsService.listImagesForAlbum(id, session.client_id ?? undefined);
  }
}
