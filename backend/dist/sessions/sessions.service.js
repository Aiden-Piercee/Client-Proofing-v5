"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SessionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionsService = void 0;
const common_1 = require("@nestjs/common");
const database_config_1 = require("../config/database.config");
const crypto = require("crypto");
const email_service_1 = require("../email/email.service");
const albums_service_1 = require("../albums/albums.service");
let SessionsService = SessionsService_1 = class SessionsService {
    constructor(proofDb, emailService, albumsService) {
        this.proofDb = proofDb;
        this.emailService = emailService;
        this.albumsService = albumsService;
        this.logger = new common_1.Logger(SessionsService_1.name);
    }
    async createAnonymousSession(albumId, clientName) {
        const token = crypto.randomBytes(16).toString('hex');
        const baseUrl = this.getBaseUrl();
        const normalizedName = (clientName === null || clientName === void 0 ? void 0 : clientName.trim()) || null;
        const [insertedClient] = await this.proofDb.query(`
      INSERT INTO clients (name, email, created_at)
      VALUES (?, NULL, NOW())
      `, [normalizedName]);
        const clientId = Number(insertedClient.insertId);
        await this.proofDb.query(`
      INSERT INTO client_sessions (album_id, token, client_id, client_name, expires_at)
      VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))
      `, [albumId, token, clientId, normalizedName !== null && normalizedName !== void 0 ? normalizedName : 'Client']);
        return {
            album_id: albumId,
            token,
            client_id: clientId,
            client_name: normalizedName !== null && normalizedName !== void 0 ? normalizedName : 'Client',
            magic_url: `${baseUrl}/proofing/${albumId}/client/${token}`
        };
    }
    async createSession(albumId, email, clientName) {
        var _a;
        const normalizedEmail = email === null || email === void 0 ? void 0 : email.trim().toLowerCase();
        if (!normalizedEmail) {
            throw new common_1.NotFoundException('Email is required to create a session.');
        }
        const client = await this.ensureClient(normalizedEmail, clientName);
        const token = crypto.randomBytes(16).toString('hex');
        await this.proofDb.query(`
      INSERT INTO client_sessions (album_id, client_id, token, client_name, expires_at)
      VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))
      `, [
            albumId,
            client.id,
            token,
            (_a = clientName !== null && clientName !== void 0 ? clientName : client.name) !== null && _a !== void 0 ? _a : normalizedEmail
        ]);
        return token;
    }
    async sendMagicLink(albumId, email, clientName, albumTitle) {
        const normalizedEmail = email === null || email === void 0 ? void 0 : email.trim().toLowerCase();
        if (!normalizedEmail) {
            throw new common_1.BadRequestException('Email is required to send the magic link.');
        }
        const token = await this.createSession(albumId, normalizedEmail, clientName);
        const baseUrl = this.getBaseUrl();
        const link = `${baseUrl}/proofing/${albumId}/client/${token}`;
        await this.emailService.sendMagicLink({
            email: normalizedEmail,
            clientName,
            albumTitle,
            link
        });
        await this.safeSendThankYou(albumId, normalizedEmail, clientName !== null && clientName !== void 0 ? clientName : null);
        return { token, link };
    }
    async attachEmailToSession(token, email, clientName) {
        var _a, _b, _c, _d, _e;
        const normalizedEmail = email === null || email === void 0 ? void 0 : email.trim().toLowerCase();
        if (!normalizedEmail) {
            throw new common_1.BadRequestException('Email is required to link the session.');
        }
        const existingSession = await this.getValidSession(token);
        if (existingSession.client_id) {
            if (existingSession.email) {
                return existingSession;
            }
            if (!existingSession.client_id) {
                throw new common_1.BadRequestException('Session is missing client linkage.');
            }
            await this.proofDb.query(`
        UPDATE clients
        SET email = ?,
            name = COALESCE(name, ?)
        WHERE id = ?
        `, [
                normalizedEmail,
                (_a = clientName !== null && clientName !== void 0 ? clientName : existingSession.client_name) !== null && _a !== void 0 ? _a : normalizedEmail,
                existingSession.client_id,
            ]);
            await this.proofDb.query(`
        UPDATE client_sessions
        SET client_name = ?,
            expires_at = COALESCE(expires_at, DATE_ADD(NOW(), INTERVAL 30 DAY))
        WHERE token = ?
        `, [(_b = clientName !== null && clientName !== void 0 ? clientName : existingSession.client_name) !== null && _b !== void 0 ? _b : normalizedEmail, token]);
            await this.safeSendThankYou(Number(existingSession.album_id), normalizedEmail, (_c = clientName !== null && clientName !== void 0 ? clientName : existingSession.client_name) !== null && _c !== void 0 ? _c : normalizedEmail);
            return this.getValidSession(token);
        }
        const client = await this.ensureClient(normalizedEmail, clientName);
        await this.proofDb.query(`
      UPDATE client_sessions
      SET client_id = ?,
          client_name = ?,
          expires_at = COALESCE(expires_at, DATE_ADD(NOW(), INTERVAL 30 DAY))
      WHERE token = ?
      `, [client.id, (_d = clientName !== null && clientName !== void 0 ? clientName : client.name) !== null && _d !== void 0 ? _d : normalizedEmail, token]);
        await this.safeSendThankYou(Number(existingSession.album_id), normalizedEmail, (_e = clientName !== null && clientName !== void 0 ? clientName : client.name) !== null && _e !== void 0 ? _e : normalizedEmail);
        return this.getValidSession(token);
    }
    async createSessionForClientId(albumId, clientId, clientName, token) {
        var _a, _b;
        const [clientRows] = await this.proofDb.query(`
      SELECT id, name, email
      FROM clients
      WHERE id = ?
      LIMIT 1
      `, [clientId]);
        if (clientRows.length === 0) {
            throw new common_1.NotFoundException('Client not found');
        }
        const client = clientRows[0];
        const tokenValue = token !== null && token !== void 0 ? token : crypto.randomBytes(16).toString('hex');
        await this.proofDb.query(`
      INSERT INTO client_sessions (album_id, client_id, token, client_name, expires_at)
      VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))
      `, [
            albumId,
            client.id,
            tokenValue,
            (_b = (_a = clientName !== null && clientName !== void 0 ? clientName : client.name) !== null && _a !== void 0 ? _a : client.email) !== null && _b !== void 0 ? _b : 'Client'
        ]);
        return { token: tokenValue, album_id: albumId, client_id: client.id };
    }
    async addAlbumToExistingToken(token, albumId) {
        if (!token) {
            throw new common_1.BadRequestException('Token is required');
        }
        await this.ensureSessionAlbumLinkTable();
        const [sessionRows] = await this.proofDb.query(`
      SELECT id, album_id, client_id, client_name
      FROM client_sessions
      WHERE token = ?
      LIMIT 1
      `, [token]);
        if (sessionRows.length === 0) {
            throw new common_1.NotFoundException('Session not found for token');
        }
        const session = sessionRows[0];
        if (!session.client_id) {
            throw new common_1.BadRequestException('Session is not linked to a client.');
        }
        if (Number(session.album_id) === Number(albumId)) {
            return {
                token,
                album_id: albumId,
                client_id: Number(session.client_id),
            };
        }
        const [existingRows] = await this.proofDb.query(`
      SELECT id
      FROM client_session_albums
      WHERE session_id = ? AND album_id = ?
      LIMIT 1
      `, [session.id, albumId]);
        if (existingRows.length === 0) {
            await this.proofDb.query(`
        INSERT INTO client_session_albums (session_id, album_id)
        VALUES (?, ?)
        `, [session.id, albumId]);
        }
        return {
            token,
            album_id: albumId,
            client_id: Number(session.client_id),
        };
    }
    async validateSession(token) {
        return await this.getValidSession(token);
    }
    async assertSessionForAlbum(token, albumId) {
        const session = await this.getValidSession(token, albumId);
        if (!session) {
            throw new common_1.ForbiddenException('Session token is not valid for this album.');
        }
        return session;
    }
    async getClientLanding(token) {
        var _a;
        const session = await this.getValidSession(token);
        let resolvedSession = session;
        if (!session.client_id) {
            const linked = await this.ensureClientForAnonymousSession(session);
            resolvedSession = linked;
        }
        if (!resolvedSession.client_id) {
            throw new common_1.BadRequestException('Session is not linked to a client.');
        }
        const [clientSessionRows] = await this.proofDb.query(`
      SELECT id, album_id, token, created_at
      FROM client_sessions
      WHERE client_id = ?
      ORDER BY created_at DESC
      `, [resolvedSession.client_id]);
        const typedSessions = clientSessionRows;
        const sessionIdList = typedSessions.map((s) => Number(s.id));
        const sessionAlbumMap = new Map();
        typedSessions.forEach((s) => {
            sessionAlbumMap.set(Number(s.id), new Set([Number(s.album_id)]));
        });
        if (sessionIdList.length > 0) {
            await this.ensureSessionAlbumLinkTable();
            const placeholders = sessionIdList.map(() => '?').join(',');
            const [linkedAlbums] = await this.proofDb.query(`
        SELECT session_id, album_id
        FROM client_session_albums
        WHERE session_id IN (${placeholders})
        `, sessionIdList);
            linkedAlbums.forEach((link) => {
                const entry = sessionAlbumMap.get(Number(link.session_id));
                if (entry) {
                    entry.add(Number(link.album_id));
                }
            });
        }
        const sessionAlbumPairs = [];
        sessionAlbumMap.forEach((albums, sessionId) => {
            const baseSession = typedSessions.find((s) => Number(s.id) === sessionId);
            if (!baseSession)
                return;
            albums.forEach((albumId) => {
                sessionAlbumPairs.push({
                    session_id: sessionId,
                    album_id: albumId,
                    token: baseSession.token,
                    created_at: baseSession.created_at,
                });
            });
        });
        const albumIds = Array.from(new Set(sessionAlbumPairs.map((s) => Number(s.album_id))));
        const albumMap = new Map();
        await Promise.all(albumIds.map(async (albumId) => {
            const album = await this.albumsService.getAlbum(albumId);
            albumMap.set(albumId, album);
        }));
        const baseUrl = this.getBaseUrl();
        return {
            client: {
                id: resolvedSession.client_id,
                name: resolvedSession.client_name,
                email: (_a = resolvedSession.email) !== null && _a !== void 0 ? _a : null,
            },
            sessions: sessionAlbumPairs.map((s) => {
                var _a;
                return ({
                    session_id: Number(s.session_id),
                    album_id: Number(s.album_id),
                    token: s.token,
                    album: (_a = albumMap.get(Number(s.album_id))) !== null && _a !== void 0 ? _a : null,
                    magic_url: `${baseUrl}/proofing/${s.album_id}/client/${s.token}`,
                });
            }),
            landing_url: `${baseUrl}/proofing/landing/${token}`,
        };
    }
    getBaseUrl() {
        const configuredBase = process.env.CLIENT_PROOFING_URL || process.env.FRONTEND_URL || '';
        return configuredBase.replace(/\/$/, '');
    }
    async getValidSession(token, albumId) {
        const [rows] = await this.proofDb.query(`
      SELECT cs.id, cs.album_id, cs.client_id, cs.token, cs.client_name,
             cs.expires_at, c.email
      FROM client_sessions cs
      LEFT JOIN clients c ON c.id = cs.client_id
      WHERE cs.token = ?
        AND (cs.expires_at IS NULL OR cs.expires_at > NOW())
      LIMIT 1
      `, [token]);
        if (rows.length === 0)
            throw new common_1.NotFoundException('Invalid session token');
        const session = rows[0];
        if (typeof albumId === 'number') {
            if (Number(session.album_id) !== Number(albumId)) {
                await this.ensureSessionAlbumLinkTable();
                const [linkRows] = await this.proofDb.query(`
          SELECT id
          FROM client_session_albums
          WHERE session_id = ? AND album_id = ?
          LIMIT 1
          `, [session.id, albumId]);
                if (linkRows.length === 0) {
                    throw new common_1.NotFoundException('Invalid session token');
                }
            }
            return { ...session, album_id: Number(albumId) };
        }
        return session;
    }
    async ensureSessionAlbumLinkTable() {
        await this.proofDb.query(`
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
      `);
    }
    async ensureClientForAnonymousSession(session) {
        var _a;
        if (session.client_id) {
            return session;
        }
        const placeholderName = ((_a = session.client_name) === null || _a === void 0 ? void 0 : _a.trim()) || 'Client';
        const [insertedClient] = await this.proofDb.query(`
      INSERT INTO clients (name, email, created_at)
      VALUES (?, NULL, NOW())
      `, [placeholderName]);
        const clientId = Number(insertedClient.insertId);
        await this.proofDb.query(`
      UPDATE client_sessions
      SET client_id = ?, client_name = COALESCE(client_name, ?)
      WHERE id = ?
      `, [clientId, placeholderName, session.id]);
        const [rows] = await this.proofDb.query(`
      SELECT cs.id, cs.album_id, cs.client_id, cs.token, cs.client_name, cs.expires_at, c.email
      FROM client_sessions cs
      LEFT JOIN clients c ON c.id = cs.client_id
      WHERE cs.id = ?
      LIMIT 1
      `, [session.id]);
        if (rows.length === 0) {
            throw new common_1.NotFoundException('Session not found after client link');
        }
        return rows[0];
    }
    async buildPreviewAttachmentsForAlbum(albumId) {
        try {
            const images = await this.albumsService.listImagesForAlbum(albumId);
            return images.slice(0, 5).map((img) => {
                var _a, _b, _c, _d;
                return ({
                    filename: img.filename,
                    path: (_d = (_c = (_b = (_a = img.thumb) !== null && _a !== void 0 ? _a : img.medium) !== null && _b !== void 0 ? _b : img.medium2x) !== null && _c !== void 0 ? _c : img.large) !== null && _d !== void 0 ? _d : undefined,
                    content: img.thumb || img.medium || img.medium2x || img.large
                        ? undefined
                        : `Preview for ${img.filename}`,
                });
            });
        }
        catch (err) {
            void err;
            return [];
        }
    }
    async sendThankYouForSession(albumId, email, clientName) {
        var _a;
        if (Number.isNaN(albumId)) {
            return;
        }
        const [album, previews] = await Promise.all([
            this.albumsService.getAlbum(albumId).catch(() => null),
            this.buildPreviewAttachmentsForAlbum(albumId),
        ]);
        await this.emailService.sendThankYouForEmailCapture({
            email,
            clientName: clientName !== null && clientName !== void 0 ? clientName : null,
            albumTitle: (_a = album === null || album === void 0 ? void 0 : album.title) !== null && _a !== void 0 ? _a : null,
            previews,
        });
    }
    async safeSendThankYou(albumId, email, clientName) {
        try {
            await this.sendThankYouForSession(albumId, email, clientName);
        }
        catch (err) {
            this.logger.warn(`Failed to send thank-you email for album ${albumId} to ${email}: ${err.message}`);
        }
    }
    async ensureClient(email, name) {
        const [rows] = await this.proofDb.query(`
      SELECT id, name, email
      FROM clients
      WHERE LOWER(email) = ?
      LIMIT 1
      `, [email.toLowerCase()]);
        if (rows.length > 0) {
            const existing = rows[0];
            if (name && !existing.name) {
                await this.proofDb.query(`UPDATE clients SET name = ? WHERE id = ?`, [name, existing.id]);
                existing.name = name;
            }
            return existing;
        }
        const [insert] = await this.proofDb.query(`
      INSERT INTO clients (name, email, created_at)
      VALUES (?, ?, NOW())
      `, [name !== null && name !== void 0 ? name : null, email]);
        return {
            id: insert.insertId,
            name: name !== null && name !== void 0 ? name : null,
            email
        };
    }
    async findLatestTokenForClient(clientId) {
        var _a;
        const [rows] = await this.proofDb.query(`
      SELECT token
      FROM client_sessions
      WHERE client_id = ?
      ORDER BY created_at DESC
      LIMIT 1
      `, [clientId]);
        if (rows.length === 0) {
            return null;
        }
        const session = rows[0];
        return (_a = session.token) !== null && _a !== void 0 ? _a : null;
    }
};
exports.SessionsService = SessionsService;
exports.SessionsService = SessionsService = SessionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_config_1.PROOFING_DB)),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => albums_service_1.AlbumsService))),
    __metadata("design:paramtypes", [Object, email_service_1.EmailService,
        albums_service_1.AlbumsService])
], SessionsService);
//# sourceMappingURL=sessions.service.js.map