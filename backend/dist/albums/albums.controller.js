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
exports.AlbumsController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const albums_service_1 = require("./albums.service");
const sessions_service_1 = require("../sessions/sessions.service");
let AlbumsController = class AlbumsController {
    constructor(albumsService, sessionService, configService) {
        this.albumsService = albumsService;
        this.sessionService = sessionService;
        this.configService = configService;
    }
    listAlbums() {
        return this.albumsService.listAlbums();
    }
    async getAlbum(id, sessionToken) {
        const allowPublicSplash = this.configService.get('ALLOW_PUBLIC_GALLERY_SPLASH') === 'true';
        if (!allowPublicSplash) {
            if (!sessionToken) {
                throw new common_1.ForbiddenException('Gallery access requires a session token.');
            }
            const session = await this.sessionService.assertSessionForAlbum(sessionToken, id);
        }
        return this.albumsService.getAlbum(id);
    }
    async getAlbumImages(id, sessionToken) {
        const session = await this.sessionService.assertSessionForAlbum(sessionToken, id);
        if (!session.client_id) {
            throw new common_1.BadRequestException('Session is not linked to a client.');
        }
        return this.albumsService.listImagesForAlbum(id, session.client_id, { hideOriginalsWithEdits: true });
    }
};
exports.AlbumsController = AlbumsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AlbumsController.prototype, "listAlbums", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('sessionToken')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], AlbumsController.prototype, "getAlbum", null);
__decorate([
    (0, common_1.Get)(':id/images'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('sessionToken')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], AlbumsController.prototype, "getAlbumImages", null);
exports.AlbumsController = AlbumsController = __decorate([
    (0, common_1.Controller)('albums'),
    __metadata("design:paramtypes", [albums_service_1.AlbumsService,
        sessions_service_1.SessionsService,
        config_1.ConfigService])
], AlbumsController);
//# sourceMappingURL=albums.controller.js.map