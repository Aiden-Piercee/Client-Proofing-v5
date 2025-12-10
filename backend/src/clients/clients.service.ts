import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Pool } from 'mysql2/promise';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { randomBytes, timingSafeEqual } from 'crypto';
import { PROOFING_DB } from '../config/database.config';

export interface ClientRecord extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  access_code: string;
}

export interface ClientProfile {
  id: number;
  name: string;
  email: string;
}

export interface SessionRecord {
  token: string;
  client_id: number;
  expires_at: Date;
}

@Injectable()
export class ClientsService {
  private readonly sessionTtlSeconds = Number(process.env.CLIENT_SESSION_TTL_SECONDS ?? 60 * 60 * 24);

  constructor(@Inject(PROOFING_DB) private readonly proofingDb: Pool) {}

  async listClients(): Promise<ClientProfile[]> {
    const [rows] = await this.proofingDb.query<RowDataPacket[]>(
      'SELECT id, name, email FROM clients ORDER BY created_at DESC LIMIT 50'
    );
    return rows as ClientProfile[];
  }

  async getClient(id: number): Promise<ClientProfile | null> {
    const [rows] = await this.proofingDb.query<RowDataPacket[]>(
      'SELECT id, name, email FROM clients WHERE id = ? LIMIT 1',
      [id]
    );
    return rows.length > 0 ? (rows[0] as ClientProfile) : null;
  }

  async login(email: string, accessCode: string) {
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail || !accessCode) {
      throw new UnauthorizedException('Email and access code are required.');
    }

    const client = await this.findClientByEmail(normalizedEmail);
    if (!client || !this.isAccessCodeValid(accessCode, client.access_code)) {
      throw new UnauthorizedException('Invalid credentials supplied.');
    }

    await this.removeExpiredSessions(client.id);
    const session = await this.createSession(client.id);

    return {
      client: { id: client.id, name: client.name, email: client.email },
      session: {
        token: session.token,
        expiresAt: session.expires_at.toISOString()
      }
    };
  }

  async logout(token: string) {
    if (!token) {
      return { removed: 0 };
    }
    const [result] = await this.proofingDb.query<ResultSetHeader>(
      'DELETE FROM client_sessions WHERE token = ?',
      [token]
    );
    return { removed: result.affectedRows };
  }

  async validateSession(token: string) {
    if (!token) {
      return null;
    }
    const [rows] = await this.proofingDb.query<RowDataPacket[]>(
      `SELECT cs.token, cs.client_id, cs.expires_at, c.name, c.email
       FROM client_sessions cs
       INNER JOIN clients c ON c.id = cs.client_id
       WHERE cs.token = ? AND cs.expires_at > NOW()
       LIMIT 1`,
      [token]
    );
    if (rows.length === 0) {
      return null;
    }

    await this.proofingDb.query('UPDATE client_sessions SET last_used_at = NOW() WHERE token = ?', [token]);
    const session = rows[0] as RowDataPacket & { client_id: number; expires_at: Date; name: string; email: string };
    return {
      token: session.token,
      expiresAt: session.expires_at,
      client: {
        id: session.client_id,
        name: session.name,
        email: session.email
      }
    };
  }

  private async findClientByEmail(email: string): Promise<ClientRecord | null> {
    const [rows] = await this.proofingDb.query<ClientRecord[]>(
      'SELECT id, name, email, access_code FROM clients WHERE LOWER(email) = ? LIMIT 1',
      [email]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  private isAccessCodeValid(attempt: string, stored: string): boolean {
    const left = Buffer.from(attempt.trim());
    const right = Buffer.from((stored ?? '').trim());
    if (left.length !== right.length) {
      return false;
    }
    return timingSafeEqual(left, right);
  }

  private async createSession(clientId: number): Promise<SessionRecord> {
    const token = randomBytes(32).toString('hex');
    const [result] = await this.proofingDb.query<ResultSetHeader>(
      `INSERT INTO client_sessions (client_id, token, expires_at, created_at, last_used_at)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? SECOND), NOW(), NOW())`,
      [clientId, token, this.sessionTtlSeconds]
    );

    if (result.affectedRows === 0) {
      throw new Error('Unable to persist session.');
    }

    const [rows] = await this.proofingDb.query<RowDataPacket[]>(
      'SELECT token, client_id, expires_at FROM client_sessions WHERE token = ? LIMIT 1',
      [token]
    );
    if (rows.length === 0) {
      throw new Error('Session persisted but could not be loaded.');
    }
    return rows[0] as SessionRecord;
  }

  private async removeExpiredSessions(clientId: number) {
    await this.proofingDb.query('DELETE FROM client_sessions WHERE client_id = ? AND expires_at <= NOW()', [clientId]);
  }
}
