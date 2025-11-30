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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionsService = void 0;
const common_1 = require("@nestjs/common");
const database_config_1 = require("../config/database.config");
const crypto = require("crypto");
const email_service_1 = require("../email/email.service");
let SessionsService = class SessionsService {
    constructor(proofDb, emailService) {
        this.proofDb = proofDb;
        this.emailService = emailService;
    }
    async createAnonymousSession(albumId) {
        const token = crypto.randomBytes(16).toString('hex');
        await this.proofDb.query(`
      INSERT INTO client_sessions (album_id, token, client_id, client_name, expires_at)
      VALUES (?, ?, NULL, NULL, DATE_ADD(NOW(), INTERVAL 30 DAY))
      `, [albumId, token]);
        return {
            album_id: albumId,
            token,
            magic_url: `${process.env.CLIENT_PROOFING_URL}/proofing/${albumId}/client/${token}`
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
        var _a;
        const token = await this.createSession(albumId, email, clientName);
        const baseUrl = (_a = process.env.CLIENT_PROOFING_URL) !== null && _a !== void 0 ? _a : '';
        const link = `${baseUrl}/proofing/${albumId}/client/${token}`;
        await this.emailService.sendMagicLink({
            email,
            clientName,
            albumTitle,
            link
        });
        return { token, link };
    }
    async validateSession(token) {
        return await this.getValidSession(token);
    }
    async assertSessionForAlbum(token, albumId) {
        const session = await this.getValidSession(token);
        if (session.album_id !== albumId) {
            throw new common_1.ForbiddenException('Session token is not valid for this album.');
        }
        return session;
    }
    async getValidSession(token) {
        const [rows] = await this.proofDb.query(`
      SELECT cs.id, cs.album_id, cs.client_id, cs.token, cs.client_name,
             cs.expires_at, c.email
      FROM client_sessions cs
      LEFT JOIN clients c ON c.id = cs.client_id
      WHERE token = ?
        AND (expires_at IS NULL OR expires_at > NOW())
      LIMIT 1
      `, [token]);
        if (rows.length === 0)
            throw new common_1.NotFoundException('Invalid session token');
        return rows[0];
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
};
exports.SessionsService = SessionsService;
exports.SessionsService = SessionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_config_1.PROOFING_DB)),
    __metadata("design:paramtypes", [Object, email_service_1.EmailService])
], SessionsService);
//# sourceMappingURL=sessions.service.js.map