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
import { ResultSetHeader, RowDataPacket } from 'mysql2';
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
      LEFT JOIN client_session_albums csa ON csa.session_id = sess.id
      WHERE sess.album_id = ? OR csa.album_id = ?
      `,
      [id, id]
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
      `
      SELECT DISTINCT cs.*
      FROM client_sessions cs
      LEFT JOIN client_session_albums csa ON csa.session_id = cs.id
      WHERE cs.album_id = ? OR csa.album_id = ?
      ORDER BY cs.created_at DESC
      `,
      [id, id]
    );

    const typedImages = images as Array<
      RowDataPacket & {
        id: number;
        title: string | null;
        thumb?: string | null;
        medium?: string | null;
        large?: string | null;
        full?: string | null;
        filename?: string | null;
      }
    >;

    const formattedImages = typedImages.map((img) => ({
      id: Number(img.id),
      title: img.title ?? null,
      thumb: img.thumb ?? null,
      medium: img.medium ?? null,
      large: img.large ?? null,
      full: img.full ?? null,
      filename: img.filename ?? null,
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

    const sessionIdList = typedRows.map((row) => Number(row.id));
    const sessionAlbumMap = new Map<number, Set<number>>();

    typedRows.forEach((row) => {
      sessionAlbumMap.set(Number(row.id), new Set([Number(row.album_id)]));
    });

    if (sessionIdList.length > 0) {
      const placeholders = sessionIdList.map(() => '?').join(',');
      const [linkedAlbums] = await this.proofDb.query<RowDataPacket[]>(
        `
        SELECT session_id, album_id
        FROM client_session_albums
        WHERE session_id IN (${placeholders})
        `,
        sessionIdList
      );

      (linkedAlbums as Array<RowDataPacket & { session_id: number; album_id: number }>).forEach(
        (link) => {
          const entry = sessionAlbumMap.get(Number(link.session_id));
          if (entry) {
            entry.add(Number(link.album_id));
          }
        }
      );
    }

    const albumIds = new Set<number>();
    sessionAlbumMap.forEach((albums) => {
      albums.forEach((albumId) => albumIds.add(albumId));
    });

    const albumMap = new Map<number, any>();

    await Promise.all(
      Array.from(albumIds).map(async (albumId) => {
        try {
          const album = await this.albumsService.getAlbum(albumId);
          albumMap.set(albumId, album);
        } catch (error) {
          // If an album is missing in Koken, keep the session but return a null album
          albumMap.set(albumId, null);
        }
      })
    );

    const baseUrl = this.getBaseUrl();

    const sessionAlbumDetails = new Map<
      number,
      Array<{ session_id: number; album_id: number; token: string; album: any; magic_url: string }>
    >();

    typedRows.forEach((row) => {
      const albumSet = sessionAlbumMap.get(Number(row.id)) ?? new Set<number>();
      const entries = Array.from(albumSet).map((albumId) => ({
        session_id: Number(row.id),
        album_id: albumId,
        token: row.token,
        album: albumMap.get(albumId) ?? null,
        magic_url: `${baseUrl}/proofing/${albumId}/client/${row.token}`,
      }));

      sessionAlbumDetails.set(Number(row.id), entries);
    });

    return typedRows.map((row) => ({
      id: Number(row.id),
      token: row.token,
      album_id: Number(row.album_id),
      client_id: row.client_id ? Number(row.client_id) : null,
      client_name: row.client_name,
      email: row.email ?? null,
      created_at: row.created_at,
      album: albumMap.get(Number(row.album_id)) ?? null,
      landing_magic_url: `${baseUrl}/proofing/landing/${row.token}`,
      client_albums: sessionAlbumDetails.get(Number(row.id)) ?? [],
    }));
  }

  async generateManagedToken(options: {
    albumIds: number[];
    clientId?: number;
    clientName?: string | null;
    email?: string | null;
  }) {
    if (!options.albumIds || options.albumIds.length === 0) {
      throw new BadRequestException('At least one album is required');
    }

    const [primaryAlbumId, ...additionalAlbumIds] = options.albumIds;
    let tokenValue: string | null = null;
    let clientId: number | null = null;

    if (options.clientId) {
      const existingToken = await this.sessionsService.findLatestTokenForClient(
        options.clientId
      );

      if (existingToken) {
        tokenValue = existingToken;
        clientId = options.clientId;
        await this.sessionsService.addAlbumToExistingToken(tokenValue, primaryAlbumId);
      } else {
        const created = await this.sessionsService.createSessionForClientId(
          primaryAlbumId,
          options.clientId,
          options.clientName ?? null
        );
        tokenValue = created.token;
        clientId = created.client_id;
      }
    } else if (options.email) {
      const normalizedEmail = options.email.trim().toLowerCase();
      const [clientRows] = await this.proofDb.query<RowDataPacket[]>(
        `
        SELECT id, name
        FROM clients
        WHERE LOWER(email) = ?
        LIMIT 1
        `,
        [normalizedEmail]
      );

      const existingClient = clientRows[0] as
        | (RowDataPacket & { id: number; name: string | null })
        | undefined;

      if (existingClient) {
        clientId = Number(existingClient.id);

        if (options.clientName && !existingClient.name) {
          await this.proofDb.query(
            `UPDATE clients SET name = ? WHERE id = ?`,
            [options.clientName, existingClient.id]
          );
        }
      } else {
        const [insert] = await this.proofDb.query<ResultSetHeader>(
          `
          INSERT INTO clients (name, email, created_at)
          VALUES (?, ?, NOW())
          `,
          [options.clientName ?? null, normalizedEmail]
        );

        clientId = Number(insert.insertId);
      }

      if (clientId !== null) {
        const existingToken = await this.sessionsService.findLatestTokenForClient(clientId);
        if (existingToken) {
          tokenValue = existingToken;
          await this.sessionsService.addAlbumToExistingToken(tokenValue, primaryAlbumId);
        }
      }

      if (!tokenValue) {
        const created = await this.sessionsService.createSession(
          primaryAlbumId,
          normalizedEmail,
          options.clientName ?? undefined
        );
        tokenValue = created;

        const [createdRows] = await this.proofDb.query<RowDataPacket[]>(
          `
          SELECT client_id
          FROM client_sessions
          WHERE token = ?
          LIMIT 1
          `,
          [tokenValue]
        );

        const createdSession = createdRows[0] as
          | (RowDataPacket & { client_id: number | null })
          | undefined;

        clientId = createdSession?.client_id ?? clientId;
      }
    } else {
      const created = await this.sessionsService.createAnonymousSession(primaryAlbumId);
      tokenValue = created.token;
    }

    if (!tokenValue) {
      throw new BadRequestException('Unable to generate or locate a session token');
    }

    if (additionalAlbumIds.length > 0 && clientId) {
      await this.linkAlbumsToSessionToken(tokenValue, additionalAlbumIds);
    }

    const [sessionRows] = await this.proofDb.query<RowDataPacket[]>(
      `
      SELECT id, album_id, client_id, token, client_name, created_at
      FROM client_sessions
      WHERE token = ?
      LIMIT 1
      `,
      [tokenValue]
    );

    const createdSession = sessionRows[0] as
      | (RowDataPacket & {
          id: number;
          album_id: number;
          client_id: number | null;
          client_name: string | null;
          created_at: Date;
        })
      | undefined;

    return (
      (createdSession && {
        id: Number(createdSession.id),
        album_id: Number(createdSession.album_id),
        client_id: createdSession.client_id ? Number(createdSession.client_id) : null,
        client_name: createdSession.client_name,
        token: tokenValue,
        created_at: createdSession.created_at,
      }) || { token: tokenValue }
    );
  }

  async linkAlbumToSessionToken(token: string, albumId: number) {
    if (!albumId || Number.isNaN(albumId)) {
      throw new BadRequestException('Album ID is required');
    }

    return this.sessionsService.addAlbumToExistingToken(token, albumId);
  }

  async linkAlbumsToSessionToken(token: string, albumIds: number[]) {
    for (const albumId of albumIds) {
      await this.linkAlbumToSessionToken(token, albumId);
    }
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

  async updateSessionDetails(
    sessionId: number,
    payload: {
      albumId?: number;
      clientId?: number | null;
      clientName?: string | null;
      clientEmail?: string | null;
    }
  ) {
    const [sessionRows] = await this.proofDb.query<RowDataPacket[]>(
      `
      SELECT id, album_id, client_id
      FROM client_sessions
      WHERE id = ?
      LIMIT 1
      `,
      [sessionId]
    );

    if (sessionRows.length === 0) {
      throw new NotFoundException('Session not found');
    }

    const session = sessionRows[0] as RowDataPacket & {
      id: number;
      album_id: number;
      client_id: number | null;
    };

    if (payload.clientId !== undefined && payload.clientId !== null) {
      const [clientRows] = await this.proofDb.query<RowDataPacket[]>(
        `
        SELECT id
        FROM clients
        WHERE id = ?
        LIMIT 1
        `,
        [payload.clientId]
      );

      if (clientRows.length === 0) {
        throw new NotFoundException('Client not found');
      }
    }

    let clientIdToLink =
      payload.clientId !== undefined ? payload.clientId : session.client_id;

    if (payload.clientEmail && payload.clientEmail.trim()) {
      const normalizedEmail = payload.clientEmail.trim().toLowerCase();
      const [clientRows] = await this.proofDb.query<RowDataPacket[]>(
        `
        SELECT id, name
        FROM clients
        WHERE LOWER(email) = ?
        LIMIT 1
        `,
        [normalizedEmail]
      );

      if (clientRows.length > 0) {
        const existing = clientRows[0] as RowDataPacket & {
          id: number;
          name: string | null;
        };

        clientIdToLink = Number(existing.id);

        if (payload.clientName && !existing.name) {
          await this.proofDb.query(
            `UPDATE clients SET name = ? WHERE id = ?`,
            [payload.clientName, existing.id]
          );
        }
      } else {
        const [insert] = await this.proofDb.query<ResultSetHeader>(
          `
          INSERT INTO clients (name, email, created_at)
          VALUES (?, ?, NOW())
          `,
          [payload.clientName ?? null, normalizedEmail]
        );

        clientIdToLink = Number(insert.insertId);
      }
    }

    const updates: string[] = [];
    const values: Array<number | string | null> = [];

    if (typeof payload.albumId === 'number') {
      updates.push('album_id = ?');
      values.push(payload.albumId);
    }

    if (payload.clientId !== undefined || payload.clientEmail) {
      updates.push('client_id = ?');
      values.push(clientIdToLink ?? null);
    }

    if (payload.clientName !== undefined) {
      updates.push('client_name = ?');
      values.push(payload.clientName);
    }

    if (
      (payload.clientName !== undefined || (payload.clientEmail && payload.clientEmail.trim())) &&
      clientIdToLink !== null &&
      clientIdToLink !== undefined
    ) {
      const clientUpdates: string[] = [];
      const clientValues: Array<string | number | null> = [];

      if (payload.clientName !== undefined) {
        clientUpdates.push('name = ?');
        clientValues.push(payload.clientName ?? null);
      }

      if (payload.clientEmail && payload.clientEmail.trim()) {
        clientUpdates.push('email = ?');
        clientValues.push(payload.clientEmail.trim().toLowerCase());
      }

      if (clientUpdates.length > 0) {
        clientValues.push(clientIdToLink);
        await this.proofDb.query(
          `UPDATE clients SET ${clientUpdates.join(', ')} WHERE id = ?`,
          clientValues,
        );
      }
    }

    if (updates.length > 0) {
      values.push(session.id);
      await this.proofDb.query(
        `UPDATE client_sessions SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    const [updatedRows] = await this.proofDb.query<RowDataPacket[]>(
      `
      SELECT id, album_id, client_id, token, client_name, created_at
      FROM client_sessions
      WHERE id = ?
      LIMIT 1
      `,
      [sessionId]
    );

    if (updatedRows.length === 0) {
      throw new NotFoundException('Session missing after update');
    }

    const updatedSession = updatedRows[0] as RowDataPacket & {
      id: number;
      album_id: number;
      client_id: number | null;
      token: string;
      client_name: string | null;
      created_at: Date;
    };

    return {
      id: Number(updatedSession.id),
      album_id: Number(updatedSession.album_id),
      client_id: updatedSession.client_id ? Number(updatedSession.client_id) : null,
      client_name: updatedSession.client_name,
      token: updatedSession.token,
      created_at: updatedSession.created_at,
    };
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

  private getBaseUrl() {
    const configuredBase =
      process.env.CLIENT_PROOFING_URL || process.env.FRONTEND_URL || '';

    return configuredBase.replace(/\/$/, '');
  }

  async listTokenResources() {
    const [clientRows] = await this.proofDb.query<RowDataPacket[]>(
      `
      SELECT id, name, email
      FROM clients
      ORDER BY name ASC
      `
    );

    const clients = (clientRows as Array<RowDataPacket & {
      id: number;
      name: string | null;
      email: string | null;
    }>).map((row) => ({
      id: Number(row.id),
      name: row.name,
      email: row.email,
    }));

    const albums = await this.albumsService.listAlbums();
    const sessions = await this.listSessions();

    const albumMap = new Map<number, any>();
    (albums as Array<RowDataPacket & { id: number }>).forEach((album) => {
      albumMap.set(Number(album.id), album);
    });

    const albumSummaries = sessions.reduce(
      (acc, session) => {
        const albumEntries =
          (session.client_albums && session.client_albums.length > 0)
            ? session.client_albums
            : [
                {
                  album_id: session.album_id,
                  token: session.token,
                  client_name: session.client_name,
                  client_id: session.client_id,
                  created_at: session.created_at,
                  album: session.album,
                },
              ];

        albumEntries.forEach((entry) => {
          const existing = acc.get(entry.album_id) ?? {
            album_id: entry.album_id,
            album: albumMap.get(entry.album_id) ?? entry.album ?? null,
            tokens: [] as Array<{
              token: string;
              client_name: string | null;
              client_id: number | null;
              created_at: Date | string;
            }>,
          };

          existing.tokens.push({
            token: session.token,
            client_name: session.client_name,
            client_id: session.client_id,
            created_at: session.created_at,
          });

          acc.set(entry.album_id, existing);
        });

        return acc;
      },
      new Map<
        number,
        {
          album_id: number;
          album: any;
          tokens: Array<{
            token: string;
            client_name: string | null;
            client_id: number | null;
            created_at: Date | string;
          }>;
        }
      >()
    );

    return {
      clients,
      albums,
      albumSummaries: Array.from(albumSummaries.values()),
    };
  }
}
