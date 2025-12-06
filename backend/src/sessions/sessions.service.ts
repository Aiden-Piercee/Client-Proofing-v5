import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
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
  async createAnonymousSession(albumId: number, clientName?: string | null) {
    const token = crypto.randomBytes(16).toString('hex');
    const baseUrl = this.getBaseUrl();
    const normalizedName = clientName?.trim() || null;

    await this.proofDb.query(
      `
      INSERT INTO client_sessions (album_id, token, client_id, client_name, expires_at)
      VALUES (?, ?, NULL, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))
      `,
      [albumId, token, normalizedName]
    );

    return {
      album_id: albumId,
      token,
      client_name: normalizedName,
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

  async attachEmailToSession(
    token: string,
    email: string,
    clientName?: string,
  ) {
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail) {
      throw new BadRequestException('Email is required to link the session.');
    }

    const existingSession = await this.getValidSession(token);

    if (existingSession.client_id) {
      return existingSession;
    }

    const client = await this.ensureClient(normalizedEmail, clientName);

    await this.proofDb.query(
      `
      UPDATE client_sessions
      SET client_id = ?,
          client_name = ?,
          expires_at = COALESCE(expires_at, DATE_ADD(NOW(), INTERVAL 30 DAY))
      WHERE token = ?
      `,
      [client.id, clientName ?? client.name ?? normalizedEmail, token],
    );

    return this.getValidSession(token);
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

    await this.ensureSessionAlbumLinkTable();

    const [sessionRows] = await this.proofDb.query<RowDataPacket[]>(
      `
      SELECT id, album_id, client_id, client_name
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
      id: number;
      album_id: number;
      client_id: number | null;
      client_name: string | null;
    };

    if (!session.client_id) {
      throw new BadRequestException('Session is not linked to a client.');
    }

    if (Number(session.album_id) === Number(albumId)) {
      return {
        token,
        album_id: albumId,
        client_id: Number(session.client_id),
      };
    }

    const [existingRows] = await this.proofDb.query<RowDataPacket[]>(
      `
      SELECT id
      FROM client_session_albums
      WHERE session_id = ? AND album_id = ?
      LIMIT 1
      `,
      [session.id, albumId]
    );

    if (existingRows.length === 0) {
      await this.proofDb.query(
        `
        INSERT INTO client_session_albums (session_id, album_id)
        VALUES (?, ?)
        `,
        [session.id, albumId]
      );
    }

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

    const sessionIdList = typedSessions.map((s) => Number(s.id));
    const sessionAlbumMap = new Map<number, Set<number>>();

    typedSessions.forEach((s) => {
      sessionAlbumMap.set(Number(s.id), new Set([Number(s.album_id)]));
    });

    if (sessionIdList.length > 0) {
      await this.ensureSessionAlbumLinkTable();

      const placeholders = sessionIdList.map(() => '?').join(',');
      const [linkedAlbums] = await this.proofDb.query<RowDataPacket[]>(
        `
        SELECT session_id, album_id
        FROM client_session_albums
        WHERE session_id IN (${placeholders})
        `,
        sessionIdList
      );

      (linkedAlbums as Array<
        RowDataPacket & { session_id: number; album_id: number }
      >).forEach((link) => {
        const entry = sessionAlbumMap.get(Number(link.session_id));
        if (entry) {
          entry.add(Number(link.album_id));
        }
      });
    }

    const sessionAlbumPairs: Array<{
      session_id: number;
      album_id: number;
      token: string;
      created_at: Date;
    }> = [];

    sessionAlbumMap.forEach((albums, sessionId) => {
      const baseSession = typedSessions.find((s) => Number(s.id) === sessionId);
      if (!baseSession) return;

      albums.forEach((albumId) => {
        sessionAlbumPairs.push({
          session_id: sessionId,
          album_id: albumId,
          token: baseSession.token,
          created_at: baseSession.created_at,
        });
      });
    });

    const albumIds = Array.from(
      new Set(sessionAlbumPairs.map((s) => Number(s.album_id)))
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
      sessions: sessionAlbumPairs.map((s) => ({
        session_id: Number(s.session_id),
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
      WHERE cs.token = ?
        AND (cs.expires_at IS NULL OR cs.expires_at > NOW())
      LIMIT 1
      `,
      typeof albumId === 'number' ? [token, albumId] : [token]
    );

    if (rows.length === 0) throw new NotFoundException('Invalid session token');

    const session = rows[0] as ClientSession & {
      id: number;
      album_id: number;
      client_id: number | null;
    };

    if (typeof albumId === 'number') {
      if (Number(session.album_id) !== Number(albumId)) {
        await this.ensureSessionAlbumLinkTable();

        const [linkRows] = await this.proofDb.query<RowDataPacket[]>(
          `
          SELECT id
          FROM client_session_albums
          WHERE session_id = ? AND album_id = ?
          LIMIT 1
          `,
          [session.id, albumId]
        );

        if (linkRows.length === 0) {
          throw new NotFoundException('Invalid session token');
        }
      }

      return { ...session, album_id: Number(albumId) } as ClientSession;
    }

    return session as ClientSession;
  }

  private async ensureSessionAlbumLinkTable() {
    await this.proofDb.query(
      `
      CREATE TABLE IF NOT EXISTS client_session_albums (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id INT NOT NULL,
        album_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY client_session_album_unique (session_id, album_id),
        INDEX idx_client_session_albums_album (album_id),
        CONSTRAINT fk_client_session_albums_session FOREIGN KEY (session_id)
          REFERENCES client_sessions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `
    );
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
