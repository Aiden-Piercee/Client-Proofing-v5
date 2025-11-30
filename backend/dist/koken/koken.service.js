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
exports.KokenService = void 0;
const common_1 = require("@nestjs/common");
const database_config_1 = require("../config/database.config");
const node_fetch_1 = require("node-fetch");
const KOKEN_BASE = "http://clients.chasing.media";
let KokenService = class KokenService {
    constructor(kokenDb) {
        this.kokenDb = kokenDb;
        this.neutralPlaceholder = 'data:image/svg+xml;utf8,' +
            encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="90" viewBox="0 0 120 90" fill="none"><rect width="120" height="90" rx="8" fill="#f3f4f6"/><path d="M32 60l14-18 12 15 10-12 10 15H32z" fill="#d1d5db"/><circle cx="44" cy="38" r="6" fill="#e5e7eb"/></svg>');
    }
    async enrichAlbumCovers(albums) {
        if (!albums.length)
            return [];
        const normalized = albums.map((album) => ({
            ...album,
            cover_id: album.cover_id !== null ? Number(album.cover_id) : null,
        }));
        const coverIds = normalized
            .map((a) => a.cover_id)
            .filter((id) => !!id);
        const coverImages = new Map();
        await Promise.all(coverIds.map(async (id) => {
            try {
                const img = await this.getImageById(id);
                coverImages.set(id, img);
            }
            catch (_a) { }
        }));
        return normalized.map((album) => {
            var _a, _b, _c;
            const cover = album.cover_id ? coverImages.get(album.cover_id) : null;
            const cover_url = (_c = (_b = (_a = cover === null || cover === void 0 ? void 0 : cover.thumb) !== null && _a !== void 0 ? _a : cover === null || cover === void 0 ? void 0 : cover.medium) !== null && _b !== void 0 ? _b : cover === null || cover === void 0 ? void 0 : cover.full) !== null && _c !== void 0 ? _c : this.neutralPlaceholder;
            return { ...album, cover_url };
        });
    }
    async listAlbums() {
        const [rows] = await this.kokenDb.query(`SELECT
         a.id,
         a.title,
         a.slug,
         a.visibility,
         a.created_on,
         covers.cover_id
       FROM koken_albums a
       LEFT JOIN koken_join_albums_covers covers ON covers.album_id = a.id
       WHERE a.deleted = 0
       GROUP BY a.id
       ORDER BY a.created_on DESC`);
        return this.enrichAlbumCovers(rows);
    }
    async getAlbumById(id) {
        const [rows] = await this.kokenDb.query(`SELECT
         a.id,
         a.title,
         a.slug,
         a.visibility,
         a.created_on,
         covers.cover_id
       FROM koken_albums a
       LEFT JOIN koken_join_albums_covers covers ON covers.album_id = a.id
       WHERE a.id = ? AND a.deleted = 0
       LIMIT 1`, [id]);
        if (!rows.length)
            throw new common_1.NotFoundException(`Album ${id} not found`);
        const enriched = await this.enrichAlbumCovers(rows);
        return enriched[0];
    }
    async fetchKokenImage(id) {
        const res = await (0, node_fetch_1.default)(`${KOKEN_BASE}/api.php?/content/${id}`);
        if (!res.ok)
            throw new Error(`Koken API returned ${res.status}`);
        return res.json();
    }
    buildStoragePath(internalId, filename) {
        return `/storage/originals/${internalId.substring(0, 2)}/${internalId.substring(2, 4)}/${filename}`;
    }
    enrichPresets(api) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x;
        const p = (_a = api === null || api === void 0 ? void 0 : api.presets) !== null && _a !== void 0 ? _a : {};
        return {
            tiny: (_c = (_b = p.tiny) === null || _b === void 0 ? void 0 : _b.url) !== null && _c !== void 0 ? _c : null,
            tiny2x: (_e = (_d = p.tiny) === null || _d === void 0 ? void 0 : _d.hidpi_url) !== null && _e !== void 0 ? _e : null,
            small: (_g = (_f = p.small) === null || _f === void 0 ? void 0 : _f.url) !== null && _g !== void 0 ? _g : null,
            small2x: (_j = (_h = p.small) === null || _h === void 0 ? void 0 : _h.hidpi_url) !== null && _j !== void 0 ? _j : null,
            medium: (_l = (_k = p.medium) === null || _k === void 0 ? void 0 : _k.url) !== null && _l !== void 0 ? _l : null,
            medium2x: (_o = (_m = p.medium) === null || _m === void 0 ? void 0 : _m.hidpi_url) !== null && _o !== void 0 ? _o : null,
            large: (_q = (_p = p.large) === null || _p === void 0 ? void 0 : _p.url) !== null && _q !== void 0 ? _q : null,
            large2x: (_s = (_r = p.large) === null || _r === void 0 ? void 0 : _r.hidpi_url) !== null && _s !== void 0 ? _s : null,
            huge: (_v = (_u = (_t = p.huge) === null || _t === void 0 ? void 0 : _t.url) !== null && _u !== void 0 ? _u : api.url) !== null && _v !== void 0 ? _v : null,
            huge2x: (_x = (_w = p.huge) === null || _w === void 0 ? void 0 : _w.hidpi_url) !== null && _x !== void 0 ? _x : null,
        };
    }
    async listImagesForAlbum(albumId) {
        const [rows] = await this.kokenDb.query(`SELECT
         c.id,
         c.title,
         c.caption,
         c.filename,
         c.internal_id,
         c.favorite,
         c.visibility,
         c.modified_on,
         c.captured_on
       FROM koken_join_albums_content jac
       INNER JOIN koken_content c ON jac.content_id = c.id
       WHERE jac.album_id = ? AND c.deleted = 0
       ORDER BY jac.order ASC`, [albumId]);
        const typed = rows;
        return Promise.all(typed.map(async (img) => {
            var _a, _b, _c, _d;
            try {
                const api = await this.fetchKokenImage(img.id);
                const p = this.enrichPresets(api);
                img.thumb = (_b = (_a = p.small) !== null && _a !== void 0 ? _a : p.medium) !== null && _b !== void 0 ? _b : null;
                img.thumb2x = (_d = (_c = p.small2x) !== null && _c !== void 0 ? _c : p.medium2x) !== null && _d !== void 0 ? _d : null;
                img.medium = p.medium;
                img.medium2x = p.medium2x;
                img.large = p.large;
                img.large2x = p.large2x;
                img.full = p.huge;
                img.storage_path = this.buildStoragePath(img.internal_id, img.filename);
            }
            catch (_e) { }
            return img;
        }));
    }
    async getImageById(imageId) {
        var _a, _b, _c, _d;
        const [rows] = await this.kokenDb.query(`SELECT
         id,
         title,
         caption,
         filename,
         internal_id,
         favorite,
         visibility,
         modified_on,
         captured_on
       FROM koken_content
       WHERE id = ? AND deleted = 0
       LIMIT 1`, [imageId]);
        if (!rows.length)
            throw new common_1.NotFoundException(`Image ${imageId} not found`);
        const img = rows[0];
        try {
            const api = await this.fetchKokenImage(imageId);
            const p = this.enrichPresets(api);
            img.thumb = (_b = (_a = p.small) !== null && _a !== void 0 ? _a : p.medium) !== null && _b !== void 0 ? _b : null;
            img.thumb2x = (_d = (_c = p.small2x) !== null && _c !== void 0 ? _c : p.medium2x) !== null && _d !== void 0 ? _d : null;
            img.medium = p.medium;
            img.medium2x = p.medium2x;
            img.large = p.large;
            img.large2x = p.large2x;
            img.full = p.huge;
            img.storage_path = this.buildStoragePath(img.internal_id, img.filename);
        }
        catch (_e) { }
        return img;
    }
    async writeFavoriteToKoken(imageId) {
        const [result] = await this.kokenDb.query(`UPDATE koken_content
       SET favorite = 1, favorited_on = UNIX_TIMESTAMP()
       WHERE id = ? AND deleted = 0`, [imageId]);
        if (result.affectedRows === 0)
            throw new common_1.NotFoundException(`Image ${imageId} not found`);
    }
    async removeFavoriteFromKoken(imageId) {
        const [result] = await this.kokenDb.query(`UPDATE koken_content
       SET favorite = 0, favorited_on = NULL
       WHERE id = ? AND deleted = 0`, [imageId]);
        if (result.affectedRows === 0)
            throw new common_1.NotFoundException(`Image ${imageId} not found`);
    }
};
exports.KokenService = KokenService;
exports.KokenService = KokenService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_config_1.KOKEN_DB)),
    __metadata("design:paramtypes", [Object])
], KokenService);
//# sourceMappingURL=koken.service.js.map