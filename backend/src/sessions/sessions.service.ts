import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { Pool } from 'mysql2/promise';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { PROOFING_DB } from '../config/database.config';
import * as crypto from 'crypto';
import { EmailService } from '../email/email.service';
import { AlbumsService } from '../albums/albums.service';

interface ClientRecord extends RowDataPacket {
  id: number;
  name: string | null;
  email: string;
}

export interface ClientSession extends RowDataPacket {
  id: number;
  album_id: number;
  client_id: number | null;
  token: string;
  client_name: string | null;
  email: string | null;
  expires_at: Date;
}

@Injectable()
export class SessionsService {
  constructor(
    @Inject(PROOFING_DB) private proofDb: Pool,
    private readonly emailService: EmailService,
    @Inject(forwardRef(() => AlbumsService))
    private readonly albumsService: AlbumsService
  ) {}

  /** ─────────────────────────────────────────────────────────────
   *  Admin-only: Create session WITHOUT requiring client email
   *  Used when admin generates magic link before client email exists
   *  ───────────────────────────────────────────────────────────── */
  async createAnonymousSession(albumId: number) {
    const token = crypto.randomBytes(16).toString('hex');
    const baseUrl = this.getBaseUrl();

    await this.proofDb.query(
      `
      INSERT INTO client_sessions (album_id, token, client_id, client_name, expires_at)
      VALUES (?, ?, NULL, NULL, DATE_ADD(NOW(), INTERVAL 30 DAY))
      `,
      [albumId, token]
    );

    return {
      album_id: albumId,
      token,
      magic_url: `${baseUrl}/proofing/${albumId}/client/${token}`
    };
  }

  /** Create a traditional session with email (client flow) */
  async createSession(
    albumId: number,
    email: string,
    clientName?: string
  ): Promise<string> {
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new NotFoundException('Email is required to create a session.');
    }

    const client = await this.ensureClient(normalizedEmail, clientName);
    const token = crypto.randomBytes(16).toString('hex');

    await this.proofDb.query(
      `
      INSERT INTO client_sessions (album_id, client_id, token, client_name, expires_at)
      VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))
      `,
      [
        albumId,
        client.id,
        token,
        clientName ?? client.name ?? normalizedEmail
      ]
    );

    return token;
  }

  async sendMagicLink(
    albumId: number,
    email: string,
    clientName?: string,
    albumTitle?: string
  ) {
    const token = await this.createSession(albumId, email, clientName);
    const baseUrl = this.getBaseUrl();
    const link = `${baseUrl}/proofing/${albumId}/client/${token}`;

    await this.emailService.sendMagicLink({
      email,
      clientName,
      albumTitle,
      link
    });

    return { token, link };
  }

  async createSessionForClientId(
    albumId: number,
    clientId: number,
    clientName?: string | null,
    token?: string
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

    const client = clientRows[0] as RowDataPacket & {
      id: number;
      name: string | null;
      email: string | null;
    };

    const tokenValue = token ?? crypto.randomBytes(16).toString('hex');

    await this.proofDb.query(
      `
      INSERT INTO client_sessions (album_id, client_id, token, client_name, expires_at)
      VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))
      `,
      [
        albumId,
        client.id,
        tokenValue,
        clientName ?? client.name ?? client.email ?? 'Client'
      ]
    );

    return { token: tokenValue, album_id: albumId, client_id: client.id };
  }

  async addAlbumToExistingToken(token: string, albumId: number) {
    if (!token) {
      throw new BadRequestException('Token is required');
    }

    const [sessionRows] = await this.proofDb.query<RowDataPacket[]>(
      `
      SELECT client_id, client_name
      FROM client_sessions
      WHERE token = ?
      LIMIT 1
      `,
      [token]
    );

    if (sessionRows.length === 0) {
      throw new NotFoundException('Session not found for token');
    }

    const session = sessionRows[0] as RowDataPacket & {
      client_id: number | null;
      client_name: string | null;
    };

    if (!session.client_id) {
      throw new BadRequestException('Session is not linked to a client.');
    }

    const [existingRows] = await this.proofDb.query<RowDataPacket[]>(
      `
      SELECT id
      FROM client_sessions
      WHERE token = ? AND album_id = ?
      LIMIT 1
      `,
      [token, albumId]
    );

    if (existingRows.length > 0) {
      return {
        token,
        album_id: albumId,
        client_id: Number(session.client_id),
      };
    }

    await this.proofDb.query(
      `
      INSERT INTO client_sessions (album_id, client_id, token, client_name, expires_at)
      VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))
      `,
      [albumId, session.client_id, token, session.client_name ?? null]
    );

    return {
      token,
      album_id: albumId,
      client_id: Number(session.client_id),
    };
  }

  async validateSession(token: string) {
    return await this.getValidSession(token);
  }

  async assertSessionForAlbum(token: string, albumId: number) {
    const session = await this.getValidSession(token, albumId);
    if (!session) {
      throw new ForbiddenException('Session token is not valid for this album.');
    }
    return session;
  }

  async getClientLanding(token: string) {
    const session = await this.getValidSession(token);

    if (!session.client_id) {
      throw new BadRequestException('Session is not linked to a client.');
    }

    const [clientSessionRows] = await this.proofDb.query<RowDataPacket[]>(
      `
      SELECT id, album_id, token, created_at
      FROM client_sessions
      WHERE client_id = ?
      ORDER BY created_at DESC
      `,
      [session.client_id]
    );

    const typedSessions = clientSessionRows as Array<
      RowDataPacket & {
        id: number;
        album_id: number;
        token: string;
        created_at: Date;
      }
    >;

    const albumIds = Array.from(
      new Set(typedSessions.map((s) => Number(s.album_id)))
    );
    const albumMap = new Map<number, any>();

    await Promise.all(
      albumIds.map(async (albumId) => {
        const album = await this.albumsService.getAlbum(albumId);
        albumMap.set(albumId, album);
      })
    );

    const baseUrl = this.getBaseUrl();

    return {
      client: {
        id: session.client_id,
        name: session.client_name,
        email: session.email ?? null,
      },
      sessions: typedSessions.map((s) => ({
        session_id: Number(s.id),
        album_id: Number(s.album_id),
        token: s.token,
        album: albumMap.get(Number(s.album_id)) ?? null,
        magic_url: `${baseUrl}/proofing/${s.album_id}/client/${s.token}`,
      })),
      landing_url: `${baseUrl}/proofing/landing/${token}`,
    };
  }

  private getBaseUrl() {
    const configuredBase =
      process.env.CLIENT_PROOFING_URL || process.env.FRONTEND_URL || '';

    return configuredBase.replace(/\/$/, '');
  }

  private async getValidSession(
    token: string,
    albumId?: number
  ): Promise<ClientSession> {
    const [rows] = await this.proofDb.query<RowDataPacket[]>(
      `
      SELECT cs.id, cs.album_id, cs.client_id, cs.token, cs.client_name,
             cs.expires_at, c.email
      FROM client_sessions cs
      LEFT JOIN clients c ON c.id = cs.client_id
      WHERE token = ?
        ${typeof albumId === 'number' ? 'AND album_id = ?' : ''}
        AND (expires_at IS NULL OR expires_at > NOW())
      LIMIT 1
      `,
      typeof albumId === 'number' ? [token, albumId] : [token]
    );

    if (rows.length === 0) throw new NotFoundException('Invalid session token');
    return rows[0] as ClientSession;
  }

  private async ensureClient(
    email: string,
    name?: string
  ): Promise<ClientRecord> {
    const [rows] = await this.proofDb.query<RowDataPacket[]>(
      `
      SELECT id, name, email
      FROM clients
      WHERE LOWER(email) = ?
      LIMIT 1
      `,
      [email.toLowerCase()]
    );

    if (rows.length > 0) {
      const existing = rows[0] as ClientRecord;

      if (name && !existing.name) {
        await this.proofDb.query(
          `UPDATE clients SET name = ? WHERE id = ?`,
          [name, existing.id]
        );
        existing.name = name;
      }

      return existing;
    }

    const [insert] = await this.proofDb.query<ResultSetHeader>(
      `
      INSERT INTO clients (name, email, created_at)
      VALUES (?, ?, NOW())
      `,
      [name ?? null, email]
    );

    return {
      id: insert.insertId,
      name: name ?? null,
      email
    } as ClientRecord;
  }

  async findLatestTokenForClient(clientId: number): Promise<string | null> {
    const [rows] = await this.proofDb.query<RowDataPacket[]>(
      `
      SELECT token
      FROM client_sessions
      WHERE client_id = ?
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [clientId]
    );

    if (rows.length === 0) {
      return null;
    }

    const session = rows[0] as RowDataPacket & { token: string | null };

    return session.token ?? null;
  }
}
