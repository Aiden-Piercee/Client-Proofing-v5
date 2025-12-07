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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const database_config_1 = require("../config/database.config");
const sessions_service_1 = require("../sessions/sessions.service");
const albums_service_1 = require("../albums/albums.service");
let AdminService = class AdminService {
    constructor(configService, jwtService, proofDb, sessionsService, albumsService) {
        this.configService = configService;
        this.jwtService = jwtService;
        this.proofDb = proofDb;
        this.sessionsService = sessionsService;
        this.albumsService = albumsService;
    }
    async login(username, password) {
        const adminUser = this.configService.get('ADMIN_USER');
        const adminPass = this.configService.get('ADMIN_PASS');
        if (!adminUser || !adminPass) {
            throw new common_1.UnauthorizedException('Admin credentials are not configured.');
        }
        if (username !== adminUser ||
            password !== adminPass) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const token = this.jwtService.sign({ username });
        return { token };
    }
    async getAlbums() {
        return this.albumsService.listAlbums();
    }
    async getAlbum(id) {
        const album = await this.albumsService.getAlbum(id);
        const images = await this.albumsService.listImagesForAlbum(id);
        const [selectionRows] = await this.proofDb.query(`
      SELECT cs.image_id, cs.state, cs.print, cs.updated_at, c.name AS client_name, c.email, c.id AS client_id
      FROM client_selections cs
      INNER JOIN clients c ON c.id = cs.client_id
      INNER JOIN client_sessions sess ON sess.client_id = cs.client_id
      LEFT JOIN client_session_albums csa ON csa.session_id = sess.id
      WHERE sess.album_id = ? OR csa.album_id = ?
      ORDER BY cs.updated_at DESC
      `, [id, id]);
        const selectionMap = new Map();
        const seenClientsByImage = new Map();
        selectionRows.forEach((row) => {
            var _a, _b;
            if (row.client_id === null || row.client_id === undefined) {
                return;
            }
            const imageId = Number(row.image_id);
            const clientId = Number(row.client_id);
            const seenClients = (_a = seenClientsByImage.get(imageId)) !== null && _a !== void 0 ? _a : new Set();
            if (seenClients.has(clientId)) {
                return;
            }
            const entry = (_b = selectionMap.get(imageId)) !== null && _b !== void 0 ? _b : [];
            entry.push({
                client_id: clientId,
                client_name: row.client_name,
                email: row.email,
                state: row.state,
                print: !!row.print,
            });
            selectionMap.set(imageId, entry);
            seenClients.add(clientId);
            seenClientsByImage.set(imageId, seenClients);
        });
        const [sessions] = await this.proofDb.query(`
      SELECT DISTINCT cs.*
      FROM client_sessions cs
      LEFT JOIN client_session_albums csa ON csa.session_id = cs.id
      WHERE cs.album_id = ? OR csa.album_id = ?
      ORDER BY cs.created_at DESC
      `, [id, id]);
        const typedImages = images;
        const formattedImages = typedImages.map((img) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
            return ({
                id: Number(img.id),
                title: (_a = img.title) !== null && _a !== void 0 ? _a : null,
                thumb: (_b = img.thumb) !== null && _b !== void 0 ? _b : null,
                medium: (_c = img.medium) !== null && _c !== void 0 ? _c : null,
                large: (_d = img.large) !== null && _d !== void 0 ? _d : null,
                full: (_e = img.full) !== null && _e !== void 0 ? _e : null,
                filename: (_f = img.filename) !== null && _f !== void 0 ? _f : null,
                public_url: (_j = (_h = (_g = img.medium) !== null && _g !== void 0 ? _g : img.thumb) !== null && _h !== void 0 ? _h : img.full) !== null && _j !== void 0 ? _j : null,
                hasEditedReplacement: !!img.hasEditedReplacement,
                isEditedReplacement: !!img.isEditedReplacement,
                original_image_id: (_k = img.original_image_id) !== null && _k !== void 0 ? _k : null,
                selections: (_l = selectionMap.get(Number(img.id))) !== null && _l !== void 0 ? _l : [],
            });
        });
        return {
            ...album,
            images: formattedImages,
            sessions
        };
    }
    async createAnonymousSession(albumId) {
        return this.sessionsService.createSession(albumId, "admin@local.test", "Admin-Generated");
    }
    async listSessions() {
        const [rows] = await this.proofDb.query(`
      SELECT cs.*, c.name AS client_name, c.email
      FROM client_sessions cs
      LEFT JOIN clients c ON c.id = cs.client_id
      ORDER BY cs.created_at DESC
      `);
        const typedRows = rows;
        const sessionIdList = typedRows.map((row) => Number(row.id));
        const sessionAlbumMap = new Map();
        typedRows.forEach((row) => {
            sessionAlbumMap.set(Number(row.id), new Set([Number(row.album_id)]));
        });
        if (sessionIdList.length > 0) {
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
        const albumIds = new Set();
        sessionAlbumMap.forEach((albums) => {
            albums.forEach((albumId) => albumIds.add(albumId));
        });
        const albumMap = new Map();
        await Promise.all(Array.from(albumIds).map(async (albumId) => {
            try {
                const album = await this.albumsService.getAlbum(albumId);
                albumMap.set(albumId, album);
            }
            catch (error) {
                albumMap.set(albumId, null);
            }
        }));
        const baseUrl = this.getBaseUrl();
        const sessionAlbumDetails = new Map();
        typedRows.forEach((row) => {
            var _a;
            const albumSet = (_a = sessionAlbumMap.get(Number(row.id))) !== null && _a !== void 0 ? _a : new Set();
            const entries = Array.from(albumSet).map((albumId) => {
                var _a;
                return ({
                    session_id: Number(row.id),
                    album_id: albumId,
                    token: row.token,
                    album: (_a = albumMap.get(albumId)) !== null && _a !== void 0 ? _a : null,
                    magic_url: `${baseUrl}/proofing/${albumId}/client/${row.token}`,
                });
            });
            sessionAlbumDetails.set(Number(row.id), entries);
        });
        return typedRows.map((row) => {
            var _a, _b, _c;
            return ({
                id: Number(row.id),
                token: row.token,
                album_id: Number(row.album_id),
                client_id: row.client_id ? Number(row.client_id) : null,
                client_name: row.client_name,
                email: (_a = row.email) !== null && _a !== void 0 ? _a : null,
                created_at: row.created_at,
                album: (_b = albumMap.get(Number(row.album_id))) !== null && _b !== void 0 ? _b : null,
                landing_magic_url: `${baseUrl}/proofing/landing/${row.token}`,
                client_albums: (_c = sessionAlbumDetails.get(Number(row.id))) !== null && _c !== void 0 ? _c : [],
            });
        });
    }
    async listClientsWithAlbums() {
        const [clientRows] = await this.proofDb.query(`
      SELECT id, name, email
      FROM clients
      ORDER BY created_at DESC
      `);
        const clients = clientRows.map((row) => ({
            id: Number(row.id),
            name: row.name,
            email: row.email,
        }));
        if (clients.length === 0) {
            return [];
        }
        const clientIds = clients.map((client) => client.id);
        const clientPlaceholders = clientIds.map(() => '?').join(',');
        const [sessionRows] = await this.proofDb.query(`
      SELECT id, album_id, client_id, token
      FROM client_sessions
      WHERE client_id IN (${clientPlaceholders})
      `, clientIds);
        const sessionAlbums = new Map();
        const typedSessions = sessionRows;
        typedSessions.forEach((row) => {
            var _a;
            if (!row.client_id) {
                return;
            }
            const clientId = Number(row.client_id);
            const entry = (_a = sessionAlbums.get(clientId)) !== null && _a !== void 0 ? _a : { albumIds: new Set(), tokens: new Set() };
            entry.albumIds.add(Number(row.album_id));
            entry.tokens.add(row.token);
            sessionAlbums.set(clientId, entry);
        });
        const sessionIds = typedSessions.map((row) => Number(row.id));
        if (sessionIds.length > 0) {
            const sessionPlaceholders = sessionIds.map(() => '?').join(',');
            const [linkedAlbums] = await this.proofDb.query(`
        SELECT session_id, album_id
        FROM client_session_albums
        WHERE session_id IN (${sessionPlaceholders})
        `, sessionIds);
            linkedAlbums.forEach((link) => {
                var _a;
                const session = typedSessions.find((row) => Number(row.id) === Number(link.session_id));
                if (!session || !session.client_id) {
                    return;
                }
                const clientId = Number(session.client_id);
                const entry = (_a = sessionAlbums.get(clientId)) !== null && _a !== void 0 ? _a : { albumIds: new Set(), tokens: new Set() };
                entry.albumIds.add(Number(link.album_id));
                entry.tokens.add(session.token);
                sessionAlbums.set(clientId, entry);
            });
        }
        const albumIds = new Set();
        sessionAlbums.forEach((value) => {
            value.albumIds.forEach((albumId) => albumIds.add(albumId));
        });
        const albumDetails = new Map();
        await Promise.all(Array.from(albumIds).map(async (albumId) => {
            try {
                const album = await this.albumsService.getAlbum(albumId);
                const images = await this.albumsService.listImagesForAlbum(albumId);
                let originalCount = 0;
                let editedCount = 0;
                images.forEach((img) => {
                    var _a;
                    const filename = `${(_a = img.filename) !== null && _a !== void 0 ? _a : ''}`;
                    if (filename.toLowerCase().includes('-edit')) {
                        editedCount += 1;
                    }
                    else {
                        originalCount += 1;
                    }
                });
                albumDetails.set(albumId, { album, originalCount, editedCount });
            }
            catch (error) {
                albumDetails.set(albumId, { album: null, originalCount: 0, editedCount: 0 });
            }
        }));
        return clients.map((client) => {
            var _a;
            const mapping = (_a = sessionAlbums.get(client.id)) !== null && _a !== void 0 ? _a : { albumIds: new Set(), tokens: new Set() };
            const albums = Array.from(mapping.albumIds).map((albumId) => {
                var _a;
                const details = (_a = albumDetails.get(albumId)) !== null && _a !== void 0 ? _a : { album: null, originalCount: 0, editedCount: 0 };
                return {
                    album_id: albumId,
                    album: details.album,
                    original_count: details.originalCount,
                    edited_count: details.editedCount,
                };
            });
            const originalTotal = albums.reduce((acc, item) => acc + item.original_count, 0);
            const editedTotal = albums.reduce((acc, item) => acc + item.edited_count, 0);
            return {
                ...client,
                albums,
                tokens: Array.from(mapping.tokens),
                original_total: originalTotal,
                edited_total: editedTotal,
            };
        });
    }
    async generateManagedToken(options) {
        var _a, _b, _c, _d, _e;
        if (!options.albumIds || options.albumIds.length === 0) {
            throw new common_1.BadRequestException('At least one album is required');
        }
        const [primaryAlbumId, ...additionalAlbumIds] = options.albumIds;
        let tokenValue = null;
        let clientId = null;
        if (options.clientId) {
            const existingToken = await this.sessionsService.findLatestTokenForClient(options.clientId);
            if (existingToken) {
                tokenValue = existingToken;
                clientId = options.clientId;
                await this.sessionsService.addAlbumToExistingToken(tokenValue, primaryAlbumId);
            }
            else {
                const created = await this.sessionsService.createSessionForClientId(primaryAlbumId, options.clientId, (_a = options.clientName) !== null && _a !== void 0 ? _a : null);
                tokenValue = created.token;
                clientId = created.client_id;
            }
        }
        else if (options.email) {
            const normalizedEmail = options.email.trim().toLowerCase();
            const [clientRows] = await this.proofDb.query(`
        SELECT id, name
        FROM clients
        WHERE LOWER(email) = ?
        LIMIT 1
        `, [normalizedEmail]);
            const existingClient = clientRows[0];
            if (existingClient) {
                clientId = Number(existingClient.id);
                if (options.clientName && !existingClient.name) {
                    await this.proofDb.query(`UPDATE clients SET name = ? WHERE id = ?`, [options.clientName, existingClient.id]);
                }
            }
            else {
                const [insert] = await this.proofDb.query(`
          INSERT INTO clients (name, email, created_at)
          VALUES (?, ?, NOW())
          `, [(_b = options.clientName) !== null && _b !== void 0 ? _b : null, normalizedEmail]);
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
                const created = await this.sessionsService.createSession(primaryAlbumId, normalizedEmail, (_c = options.clientName) !== null && _c !== void 0 ? _c : undefined);
                tokenValue = created;
                const [createdRows] = await this.proofDb.query(`
          SELECT client_id
          FROM client_sessions
          WHERE token = ?
          LIMIT 1
          `, [tokenValue]);
                const createdSession = createdRows[0];
                clientId = (_d = createdSession === null || createdSession === void 0 ? void 0 : createdSession.client_id) !== null && _d !== void 0 ? _d : clientId;
            }
        }
        else {
            const created = await this.sessionsService.createAnonymousSession(primaryAlbumId, (_e = options.clientName) !== null && _e !== void 0 ? _e : null);
            tokenValue = created.token;
        }
        if (!tokenValue) {
            throw new common_1.BadRequestException('Unable to generate or locate a session token');
        }
        if (additionalAlbumIds.length > 0 && clientId) {
            await this.linkAlbumsToSessionToken(tokenValue, additionalAlbumIds);
        }
        const [sessionRows] = await this.proofDb.query(`
      SELECT id, album_id, client_id, token, client_name, created_at
      FROM client_sessions
      WHERE token = ?
      LIMIT 1
      `, [tokenValue]);
        const createdSession = sessionRows[0];
        return ((createdSession && {
            id: Number(createdSession.id),
            album_id: Number(createdSession.album_id),
            client_id: createdSession.client_id ? Number(createdSession.client_id) : null,
            client_name: createdSession.client_name,
            token: tokenValue,
            created_at: createdSession.created_at,
        }) || { token: tokenValue });
    }
    async linkAlbumToSessionToken(token, albumId) {
        if (!albumId || Number.isNaN(albumId)) {
            throw new common_1.BadRequestException('Album ID is required');
        }
        return this.sessionsService.addAlbumToExistingToken(token, albumId);
    }
    async linkAlbumsToSessionToken(token, albumIds) {
        for (const albumId of albumIds) {
            await this.linkAlbumToSessionToken(token, albumId);
        }
    }
    async removeSession(sessionId) {
        const [rows] = await this.proofDb.query(`
      SELECT id
      FROM client_sessions
      WHERE id = ?
      LIMIT 1
      `, [sessionId]);
        if (rows.length === 0) {
            throw new common_1.NotFoundException('Session not found');
        }
        await this.proofDb.query('DELETE FROM client_sessions WHERE id = ?', [
            sessionId,
        ]);
        return { removed: true };
    }
    async removeClient(clientId) {
        const [clientRows] = await this.proofDb.query(`
      SELECT id
      FROM clients
      WHERE id = ?
      LIMIT 1
      `, [clientId]);
        if (clientRows.length === 0) {
            throw new common_1.NotFoundException('Client not found');
        }
        const [sessionRows] = await this.proofDb.query(`
      SELECT id
      FROM client_sessions
      WHERE client_id = ?
      `, [clientId]);
        const sessionIds = sessionRows.map((row) => Number(row.id));
        if (sessionIds.length > 0) {
            const placeholders = sessionIds.map(() => '?').join(',');
            await this.proofDb.query(`
        DELETE FROM client_session_albums
        WHERE session_id IN (${placeholders})
        `, sessionIds);
            await this.proofDb.query(`
        DELETE FROM client_sessions
        WHERE id IN (${placeholders})
        `, sessionIds);
        }
        await this.proofDb.query(`
      DELETE FROM client_selections
      WHERE client_id = ?
      `, [clientId]);
        await this.proofDb.query(`
      DELETE FROM clients
      WHERE id = ?
      `, [clientId]);
        return { removed: true, client_id: clientId };
    }
    async updateSessionDetails(sessionId, payload) {
        var _a, _b, _c, _d, _e, _f;
        const [sessionRows] = await this.proofDb.query(`
      SELECT id, album_id, client_id
      FROM client_sessions
      WHERE id = ?
      LIMIT 1
      `, [sessionId]);
        if (sessionRows.length === 0) {
            throw new common_1.NotFoundException('Session not found');
        }
        const session = sessionRows[0];
        if (payload.clientId !== undefined && payload.clientId !== null) {
            const [clientRows] = await this.proofDb.query(`
        SELECT id
        FROM clients
        WHERE id = ?
        LIMIT 1
        `, [payload.clientId]);
            if (clientRows.length === 0) {
                throw new common_1.NotFoundException('Client not found');
            }
        }
        if (payload.token !== undefined) {
            const trimmedToken = (_a = payload.token) === null || _a === void 0 ? void 0 : _a.trim();
            if (!trimmedToken) {
                throw new common_1.BadRequestException('Token cannot be empty');
            }
            const [tokenRows] = await this.proofDb.query(`
        SELECT id
        FROM client_sessions
        WHERE token = ? AND id <> ?
        LIMIT 1
        `, [trimmedToken, sessionId]);
            if (tokenRows.length > 0) {
                throw new common_1.BadRequestException('Token is already in use');
            }
        }
        let clientIdToLink = payload.clientId !== undefined ? payload.clientId : session.client_id;
        if (payload.clientEmail && payload.clientEmail.trim()) {
            const normalizedEmail = payload.clientEmail.trim().toLowerCase();
            const [clientRows] = await this.proofDb.query(`
        SELECT id, name
        FROM clients
        WHERE LOWER(email) = ?
        LIMIT 1
        `, [normalizedEmail]);
            if (clientRows.length > 0) {
                const existing = clientRows[0];
                clientIdToLink = Number(existing.id);
                if (payload.clientName && !existing.name) {
                    await this.proofDb.query(`UPDATE clients SET name = ? WHERE id = ?`, [payload.clientName, existing.id]);
                }
            }
            else {
                const [insert] = await this.proofDb.query(`
          INSERT INTO clients (name, email, created_at)
          VALUES (?, ?, NOW())
          `, [(_b = payload.clientName) !== null && _b !== void 0 ? _b : null, normalizedEmail]);
                clientIdToLink = Number(insert.insertId);
            }
        }
        if ((payload.clientName !== undefined && payload.clientName !== null) &&
            (clientIdToLink === null || clientIdToLink === undefined) &&
            payload.clientId !== null &&
            !payload.clientEmail) {
            const [insertedClient] = await this.proofDb.query(`
        INSERT INTO clients (name, email, created_at)
        VALUES (?, NULL, NOW())
        `, [(_c = payload.clientName) !== null && _c !== void 0 ? _c : null]);
            clientIdToLink = Number(insertedClient.insertId);
        }
        const updates = [];
        const values = [];
        if (typeof payload.albumId === 'number') {
            updates.push('album_id = ?');
            values.push(payload.albumId);
        }
        if (payload.clientId !== undefined || payload.clientEmail) {
            updates.push('client_id = ?');
            values.push(clientIdToLink !== null && clientIdToLink !== void 0 ? clientIdToLink : null);
        }
        if (payload.clientName !== undefined) {
            updates.push('client_name = ?');
            values.push(payload.clientName);
        }
        if ((payload.clientName !== undefined || (payload.clientEmail && payload.clientEmail.trim())) &&
            clientIdToLink !== null &&
            clientIdToLink !== undefined) {
            const clientUpdates = [];
            const clientValues = [];
            if (payload.clientName !== undefined) {
                clientUpdates.push('name = ?');
                clientValues.push((_d = payload.clientName) !== null && _d !== void 0 ? _d : null);
            }
            if (payload.clientEmail && payload.clientEmail.trim()) {
                clientUpdates.push('email = ?');
                clientValues.push(payload.clientEmail.trim().toLowerCase());
            }
            if (clientUpdates.length > 0) {
                clientValues.push(clientIdToLink);
                await this.proofDb.query(`UPDATE clients SET ${clientUpdates.join(', ')} WHERE id = ?`, clientValues);
            }
        }
        if (payload.token !== undefined) {
            updates.push('token = ?');
            values.push((_f = (_e = payload.token) === null || _e === void 0 ? void 0 : _e.trim()) !== null && _f !== void 0 ? _f : null);
        }
        if (updates.length > 0) {
            values.push(session.id);
            await this.proofDb.query(`UPDATE client_sessions SET ${updates.join(', ')} WHERE id = ?`, values);
        }
        const [updatedRows] = await this.proofDb.query(`
      SELECT id, album_id, client_id, token, client_name, created_at
      FROM client_sessions
      WHERE id = ?
      LIMIT 1
      `, [sessionId]);
        if (updatedRows.length === 0) {
            throw new common_1.NotFoundException('Session missing after update');
        }
        const updatedSession = updatedRows[0];
        return {
            id: Number(updatedSession.id),
            album_id: Number(updatedSession.album_id),
            client_id: updatedSession.client_id ? Number(updatedSession.client_id) : null,
            client_name: updatedSession.client_name,
            token: updatedSession.token,
            created_at: updatedSession.created_at,
        };
    }
    async updateClientDetails(clientId, payload) {
        const [clientRows] = await this.proofDb.query(`
      SELECT id, name, email
      FROM clients
      WHERE id = ?
      LIMIT 1
      `, [clientId]);
        if (clientRows.length === 0) {
            throw new common_1.NotFoundException('Client not found');
        }
        const updates = [];
        const values = [];
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
            await this.proofDb.query(`UPDATE clients SET ${updates.join(', ')} WHERE id = ?`, values);
        }
        const [updatedRows] = await this.proofDb.query(`
      SELECT id, name, email
      FROM clients
      WHERE id = ?
      LIMIT 1
      `, [clientId]);
        if (updatedRows.length === 0) {
            throw new common_1.NotFoundException('Client missing after update');
        }
        return updatedRows[0];
    }
    getBaseUrl() {
        const configuredBase = process.env.CLIENT_PROOFING_URL || process.env.FRONTEND_URL || '';
        return configuredBase.replace(/\/$/, '');
    }
    async listTokenResources() {
        const [clientRows] = await this.proofDb.query(`
      SELECT id, name, email
      FROM clients
      ORDER BY name ASC
      `);
        const clients = clientRows.map((row) => ({
            id: Number(row.id),
            name: row.name,
            email: row.email,
        }));
        const albums = await this.albumsService.listAlbums();
        const sessions = await this.listSessions();
        const albumMap = new Map();
        albums.forEach((album) => {
            albumMap.set(Number(album.id), album);
        });
        const albumSummaries = sessions.reduce((acc, session) => {
            const albumEntries = (session.client_albums && session.client_albums.length > 0)
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
                var _a, _b, _c;
                const existing = (_a = acc.get(entry.album_id)) !== null && _a !== void 0 ? _a : {
                    album_id: entry.album_id,
                    album: (_c = (_b = albumMap.get(entry.album_id)) !== null && _b !== void 0 ? _b : entry.album) !== null && _c !== void 0 ? _c : null,
                    tokens: [],
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
        }, new Map());
        return {
            clients,
            albums,
            albumSummaries: Array.from(albumSummaries.values()),
        };
    }
    async listHousekeeping() {
        const [clientRows] = await this.proofDb.query(`
      SELECT id, name, email, created_at
      FROM clients
      ORDER BY created_at DESC
      `);
        const clients = clientRows.map((row) => ({
            id: Number(row.id),
            name: row.name,
            email: row.email,
            created_at: row.created_at,
        }));
        const sessions = await this.listSessions();
        return { clients, sessions };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)(database_config_1.PROOFING_DB)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        jwt_1.JwtService, Object, sessions_service_1.SessionsService,
        albums_service_1.AlbumsService])
], AdminService);
//# sourceMappingURL=admin.service.js.map