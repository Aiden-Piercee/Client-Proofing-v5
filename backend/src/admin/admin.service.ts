import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Inject
} from '@nestjs/common';
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

    const [selectionRows] = await this.proofDb.query<RowDataPacket[]>(
      `
      SELECT DISTINCT cs.image_id, cs.state, cs.print, c.name AS client_name, c.email, c.id AS client_id
      FROM client_selections cs
      INNER JOIN clients c ON c.id = cs.client_id
      INNER JOIN client_sessions sess ON sess.client_id = cs.client_id
      WHERE sess.album_id = ?
      `,
      [id]
    );

    const selectionMap = new Map<number, Array<{ client_id: number; client_name: string | null; email: string | null; state: string | null; print: boolean }>>();

    (selectionRows as Array<RowDataPacket & { image_id: number; state: string | null; print: number; client_name: string | null; email: string | null; client_id: number }>).forEach((row) => {
      const entry = selectionMap.get(row.image_id) ?? [];
      entry.push({
        client_id: Number(row.client_id),
        client_name: row.client_name,
        email: row.email,
        state: row.state,
        print: !!row.print,
      });
      selectionMap.set(row.image_id, entry);
    });

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
      selections: selectionMap.get(Number(img.id)) ?? [],
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
      `
      SELECT cs.*, c.name AS client_name, c.email
      FROM client_sessions cs
      LEFT JOIN clients c ON c.id = cs.client_id
      ORDER BY cs.created_at DESC
      `
    );

    const typedRows = rows as Array<
      RowDataPacket & {
        id: number;
        album_id: number;
        token: string;
        created_at: Date;
        client_id: number | null;
        client_name: string | null;
        email: string | null;
      }
    >;

    const albumIds = Array.from(new Set(typedRows.map((r) => Number(r.album_id))));
    const albumMap = new Map<number, any>();

    await Promise.all(
      albumIds.map(async (albumId) => {
        try {
          const album = await this.albumsService.getAlbum(albumId);
          albumMap.set(albumId, album);
        } catch (error) {
          // If an album is missing in Koken, keep the session but return a null album
          albumMap.set(albumId, null);
        }
      })
    );

    const clientSessionMap = new Map<
      number,
      Array<{ id: number; album_id: number; token: string; created_at: Date }>
    >();

    for (const row of typedRows) {
      if (!row.client_id || clientSessionMap.has(row.client_id)) continue;

      const [clientSessions] = await this.proofDb.query<RowDataPacket[]>(
        `
        SELECT id, album_id, token, created_at
        FROM client_sessions
        WHERE client_id = ?
        ORDER BY created_at DESC
        `,
        [row.client_id]
      );

      const typedSessions = clientSessions as Array<
        RowDataPacket & {
          id: number;
          album_id: number;
          token: string;
          created_at: Date;
        }
      >;

      clientSessionMap.set(
        row.client_id,
        typedSessions.map((s) => ({
          id: Number(s.id),
          album_id: Number(s.album_id),
          token: s.token,
          created_at: s.created_at,
        }))
      );
    }

    const baseUrl = process.env.CLIENT_PROOFING_URL ?? '';

    return typedRows.map((row) => {
      const relatedSessions = row.client_id
        ? clientSessionMap.get(row.client_id) ?? []
        : [];

      return {
        id: Number(row.id),
        token: row.token,
        album_id: Number(row.album_id),
        client_id: row.client_id ? Number(row.client_id) : null,
        client_name: row.client_name,
        email: row.email ?? null,
        created_at: row.created_at,
        album: albumMap.get(Number(row.album_id)) ?? null,
        landing_magic_url: `${baseUrl}/proofing/landing/${row.token}`,
        client_albums: relatedSessions.map((session) => ({
          ...session,
          album: albumMap.get(session.album_id) ?? null,
          magic_url: `${baseUrl}/proofing/${session.album_id}/client/${session.token}`,
        })),
      };
    });
  }

  async generateManagedToken(options: {
    albumId: number;
    clientId?: number;
    clientName?: string | null;
    email?: string | null;
  }) {
    if (options.clientId) {
      return this.sessionsService.createSessionForClientId(
        options.albumId,
        options.clientId,
        options.clientName ?? null
      );
    }

    if (options.email) {
      return this.sessionsService.createSession(
        options.albumId,
        options.email,
        options.clientName ?? undefined
      );
    }

    return this.sessionsService.createAnonymousSession(options.albumId);
  }

  async linkAlbumToSessionToken(token: string, albumId: number) {
    const [rows] = await this.proofDb.query<RowDataPacket[]>(
      `
      SELECT client_id
      FROM client_sessions
      WHERE token = ?
      LIMIT 1
      `,
      [token]
    );

    if (rows.length === 0) {
      throw new NotFoundException('Session not found');
    }

    const session = rows[0] as RowDataPacket & { client_id: number | null };

    if (!session.client_id) {
      throw new BadRequestException('Session is not linked to a client');
    }

    return this.sessionsService.createSessionForClientId(
      albumId,
      session.client_id
    );
  }

  async removeSession(sessionId: number) {
    const [rows] = await this.proofDb.query<RowDataPacket[]>(
      `
      SELECT id
      FROM client_sessions
      WHERE id = ?
      LIMIT 1
      `,
      [sessionId]
    );

    if (rows.length === 0) {
      throw new NotFoundException('Session not found');
    }

    await this.proofDb.query('DELETE FROM client_sessions WHERE id = ?', [
      sessionId,
    ]);

    return { removed: true };
  }

  async updateClientDetails(
    clientId: number,
    payload: { name?: string | null; email?: string | null }
  ) {
    const [clientRows] = await this.proofDb.query<RowDataPacket[]>(
      `
      SELECT id, name, email
      FROM clients
      WHERE id = ?
      LIMIT 1
      `,
      [clientId]
    );

    if (clientRows.length === 0) {
      throw new NotFoundException('Client not found');
    }

    const updates: string[] = [];
    const values: Array<string | number> = [];

    if (typeof payload.name === 'string') {
      updates.push('name = ?');
      values.push(payload.name);
    }

    if (typeof payload.email === 'string' && payload.email.trim()) {
      updates.push('email = ?');
      values.push(payload.email.trim().toLowerCase());
    }

    if (updates.length > 0) {
      values.push(clientId);
      await this.proofDb.query(
        `UPDATE clients SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    const [updatedRows] = await this.proofDb.query<RowDataPacket[]>(
      `
      SELECT id, name, email
      FROM clients
      WHERE id = ?
      LIMIT 1
      `,
      [clientId]
    );

    if (updatedRows.length === 0) {
      throw new NotFoundException('Client missing after update');
    }

    return updatedRows[0] as RowDataPacket & {
      id: number;
      name: string | null;
      email: string | null;
    };
  }
}
