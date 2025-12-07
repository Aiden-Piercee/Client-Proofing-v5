import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AlbumsService } from './albums.service';
import { SessionsService } from '../sessions/sessions.service';

@Controller('albums')
export class AlbumsController {
  constructor(
    private readonly albumsService: AlbumsService,
    private readonly sessionService: SessionsService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  listAlbums() {
    return this.albumsService.listAlbums();
  }

  @Get(':id')
  async getAlbum(
    @Param('id', ParseIntPipe) id: number,
    @Query('sessionToken') sessionToken?: string,
  ) {
    const allowPublicSplash =
      this.configService.get<string>('ALLOW_PUBLIC_GALLERY_SPLASH') === 'true';

    if (!allowPublicSplash) {
      if (!sessionToken) {
        throw new ForbiddenException('Gallery access requires a session token.');
      }

      const session = await this.sessionService.assertSessionForAlbum(
        sessionToken,
        id,
      );
    }

    return this.albumsService.getAlbum(id);
  }

    @Get(':id/images')
    async getAlbumImages(
      @Param('id', ParseIntPipe) id: number,
      @Query('sessionToken') sessionToken: string
    ) {
      const session = await this.sessionService.assertSessionForAlbum(sessionToken, id);
      if (!session.client_id) {
        throw new BadRequestException('Session is not linked to a client.');
      }
      return this.albumsService.listImagesForAlbum(
        id,
        session.client_id,
        { hideOriginalsWithEdits: true },
      );
    }
}
