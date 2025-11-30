import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { Pool, RowDataPacket } from 'mysql2/promise';
import { PROOFING_DB } from '../config/database.config';
import * as crypto from 'crypto';
import { EmailService } from '../email/email.service';

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
  client_name: string;
  email: string | null;
  expires_at: Date;
}

@Injectable()
export class SessionsService {
  constructor(
    @Inject(PROOFING_DB) private proofDb: Pool,
    private readonly emailService: EmailService
  ) {}

  /** ─────────────────────────────────────────────────────────────
   *  Admin-only: Create session WITHOUT requiring client email
   *  Used when admin generates magic link before client email exists
   *  ───────────────────────────────────────────────────────────── */
  async createAnonymousSession(albumId: number) {
    const token = crypto.randomBytes(16).toString('hex');

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
      magic_url: `${process.env.CLIENT_PROOFING_URL}/proofing/${albumId}/client/${token}`
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
    const baseUrl = process.env.CLIENT_PROOFING_URL ?? '';
    const link = `${baseUrl}/proofing/${albumId}/client/${token}`;

    await this.emailService.sendMagicLink({
      email,
      clientName,
      albumTitle,
      link
    });

    return { token, link };
  }

  async validateSession(token: string) {
    return await this.getValidSession(token);
  }

  async assertSessionForAlbum(token: string, albumId: number) {
    const session = await this.getValidSession(token);
    if (session.album_id !== albumId) {
      throw new ForbiddenException('Session token is not valid for this album.');
    }
    return session;
  }

  private async getValidSession(token: string): Promise<ClientSession> {
    const [rows] = await this.proofDb.query<ClientSession[]>(
      `
      SELECT cs.id, cs.album_id, cs.client_id, cs.token, cs.client_name,
             cs.expires_at, c.email
      FROM client_sessions cs
      LEFT JOIN clients c ON c.id = cs.client_id
      WHERE token = ?
        AND (expires_at IS NULL OR expires_at > NOW())
      LIMIT 1
      `,
      [token]
    );

    if (rows.length === 0) throw new NotFoundException('Invalid session token');
    return rows[0];
  }

  private async ensureClient(
    email: string,
    name?: string
  ): Promise<ClientRecord> {
    const [rows] = await this.proofDb.query<ClientRecord[]>(
      `
      SELECT id, name, email
      FROM clients
      WHERE LOWER(email) = ?
      LIMIT 1
      `,
      [email.toLowerCase()]
    );

    if (rows.length > 0) {
      const existing = rows[0];

      if (name && !existing.name) {
        await this.proofDb.query(
          `UPDATE clients SET name = ? WHERE id = ?`,
          [name, existing.id]
        );
        existing.name = name;
      }

      return existing;
    }

    const [insert] = await this.proofDb.query<any>(
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
}
