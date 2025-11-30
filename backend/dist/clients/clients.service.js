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
exports.ClientsService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const database_config_1 = require("../config/database.config");
let ClientsService = class ClientsService {
    constructor(proofingDb) {
        var _a;
        this.proofingDb = proofingDb;
        this.sessionTtlSeconds = Number((_a = process.env.CLIENT_SESSION_TTL_SECONDS) !== null && _a !== void 0 ? _a : 60 * 60 * 24);
    }
    async listClients() {
        const [rows] = await this.proofingDb.query('SELECT id, name, email FROM clients ORDER BY created_at DESC LIMIT 50');
        return rows;
    }
    async getClient(id) {
        const [rows] = await this.proofingDb.query('SELECT id, name, email FROM clients WHERE id = ? LIMIT 1', [id]);
        return rows.length > 0 ? rows[0] : null;
    }
    async login(email, accessCode) {
        const normalizedEmail = email === null || email === void 0 ? void 0 : email.trim().toLowerCase();
        if (!normalizedEmail || !accessCode) {
            throw new common_1.UnauthorizedException('Email and access code are required.');
        }
        const client = await this.findClientByEmail(normalizedEmail);
        if (!client || !this.isAccessCodeValid(accessCode, client.access_code)) {
            throw new common_1.UnauthorizedException('Invalid credentials supplied.');
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
    async logout(token) {
        if (!token) {
            return { removed: 0 };
        }
        const [result] = await this.proofingDb.query('DELETE FROM client_sessions WHERE token = ?', [token]);
        return { removed: result.affectedRows };
    }
    async validateSession(token) {
        if (!token) {
            return null;
        }
        const [rows] = await this.proofingDb.query(`SELECT cs.token, cs.client_id, cs.expires_at, c.name, c.email
       FROM client_sessions cs
       INNER JOIN clients c ON c.id = cs.client_id
       WHERE cs.token = ? AND cs.expires_at > NOW()
       LIMIT 1`, [token]);
        if (rows.length === 0) {
            return null;
        }
        await this.proofingDb.query('UPDATE client_sessions SET last_used_at = NOW() WHERE token = ?', [token]);
        const session = rows[0];
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
    async findClientByEmail(email) {
        const [rows] = await this.proofingDb.query('SELECT id, name, email, access_code FROM clients WHERE LOWER(email) = ? LIMIT 1', [email]);
        return rows.length > 0 ? rows[0] : null;
    }
    isAccessCodeValid(attempt, stored) {
        const left = Buffer.from(attempt.trim());
        const right = Buffer.from((stored !== null && stored !== void 0 ? stored : '').trim());
        if (left.length !== right.length) {
            return false;
        }
        return (0, crypto_1.timingSafeEqual)(left, right);
    }
    async createSession(clientId) {
        const token = (0, crypto_1.randomBytes)(32).toString('hex');
        const [result] = await this.proofingDb.query(`INSERT INTO client_sessions (client_id, token, expires_at, created_at, last_used_at)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? SECOND), NOW(), NOW())`, [clientId, token, this.sessionTtlSeconds]);
        if (result.affectedRows === 0) {
            throw new Error('Unable to persist session.');
        }
        const [rows] = await this.proofingDb.query('SELECT token, client_id, expires_at FROM client_sessions WHERE token = ? LIMIT 1', [token]);
        if (rows.length === 0) {
            throw new Error('Session persisted but could not be loaded.');
        }
        return rows[0];
    }
    async removeExpiredSessions(clientId) {
        await this.proofingDb.query('DELETE FROM client_sessions WHERE client_id = ? AND expires_at <= NOW()', [clientId]);
    }
};
exports.ClientsService = ClientsService;
exports.ClientsService = ClientsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_config_1.PROOFING_DB)),
    __metadata("design:paramtypes", [Object])
], ClientsService);
//# sourceMappingURL=clients.service.js.map