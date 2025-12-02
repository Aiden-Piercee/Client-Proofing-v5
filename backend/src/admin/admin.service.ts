import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PROOFING_DB } from '../config/database.config';
import { Pool } from 'mysql2/promise';
import { RowDataPacket } from 'mysql2';
import { SessionsService } from '../sessions/sessions.service';
import { AlbumsService } from '../albums/albums.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @Inject(PROOFING_DB) private proofDb: Pool,
    private sessionsService: SessionsService,
    private albumsService: AlbumsService,
  ) {}

  async login(username: string, password: string) {
    const adminUser = this.configService.get<string>('ADMIN_USER');
    const adminPass = this.configService.get<string>('ADMIN_PASS');

    if (!adminUser || !adminPass) {
      throw new UnauthorizedException('Admin credentials are not configured.');
    }

    if (
      username !== adminUser ||
      password !== adminPass
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({ username });
    return { token };
  }

  async getAlbums() {
    return this.albumsService.listAlbums();
  }

  async getAlbum(id: number) {
    const album = await this.albumsService.getAlbum(id);
    const images = await this.albumsService.listImagesForAlbum(id);

    const [sessions] = await this.proofDb.query<RowDataPacket[]>(
      'SELECT * FROM client_sessions WHERE album_id = ? ORDER BY created_at DESC',
      [id]
    );

    const typedImages = images as Array<
      RowDataPacket & {
        id: number;
        title: string | null;
        thumb?: string | null;
        medium?: string | null;
        large?: string | null;
        full?: string | null;
      }
    >;

    const formattedImages = typedImages.map((img) => ({
      id: Number(img.id),
      title: img.title ?? null,
      thumb: img.thumb ?? null,
      medium: img.medium ?? null,
      large: img.large ?? null,
      full: img.full ?? null,
      public_url: img.medium ?? img.thumb ?? img.full ?? null,
    }));

    return {
      ...album,
      images: formattedImages,
      sessions
    };
  }

  async createAnonymousSession(albumId: number) {
    return this.sessionsService.createSession(
      albumId,
      "admin@local.test",
      "Admin-Generated"
    );
  }

  async listSessions() {
    const [rows] = await this.proofDb.query<RowDataPacket[]>(
      'SELECT * FROM client_sessions ORDER BY created_at DESC'
    );
    return rows;
  }
}
