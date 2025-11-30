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
const jwt_1 = require("@nestjs/jwt");
const database_config_1 = require("../config/database.config");
const sessions_service_1 = require("../sessions/sessions.service");
const albums_service_1 = require("../albums/albums.service");
let AdminService = class AdminService {
    constructor(jwtService, proofDb, sessionsService, albumsService) {
        this.jwtService = jwtService;
        this.proofDb = proofDb;
        this.sessionsService = sessionsService;
        this.albumsService = albumsService;
    }
    async login(username, password) {
        if (username !== process.env.ADMIN_USER ||
            password !== process.env.ADMIN_PASS) {
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
        const [sessions] = await this.proofDb.query('SELECT * FROM client_sessions WHERE album_id = ? ORDER BY created_at DESC', [id]);
        const typedImages = images;
        const formattedImages = typedImages.map((img) => {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            return ({
                id: Number(img.id),
                title: (_a = img.title) !== null && _a !== void 0 ? _a : null,
                thumb: (_b = img.thumb) !== null && _b !== void 0 ? _b : null,
                medium: (_c = img.medium) !== null && _c !== void 0 ? _c : null,
                large: (_d = img.large) !== null && _d !== void 0 ? _d : null,
                full: (_e = img.full) !== null && _e !== void 0 ? _e : null,
                public_url: (_h = (_g = (_f = img.medium) !== null && _f !== void 0 ? _f : img.thumb) !== null && _g !== void 0 ? _g : img.full) !== null && _h !== void 0 ? _h : null,
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
        const [rows] = await this.proofDb.query('SELECT * FROM client_sessions ORDER BY created_at DESC');
        return rows;
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(database_config_1.PROOFING_DB)),
    __metadata("design:paramtypes", [jwt_1.JwtService, Object, sessions_service_1.SessionsService,
        albums_service_1.AlbumsService])
], AdminService);
//# sourceMappingURL=admin.service.js.map