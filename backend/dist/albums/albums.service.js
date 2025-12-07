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
exports.AlbumsService = void 0;
const common_1 = require("@nestjs/common");
const koken_service_1 = require("../koken/koken.service");
const database_config_1 = require("../config/database.config");
let AlbumsService = class AlbumsService {
    constructor(kokenService, proofingDb) {
        this.kokenService = kokenService;
        this.proofingDb = proofingDb;
    }
    listAlbums() {
        return this.kokenService.listAlbums();
    }
    getAlbum(id) {
        return this.kokenService.getAlbumById(id);
    }
    async listImagesForAlbum(albumId, clientId, options = {}) {
        var _a;
        const images = await this.kokenService.listImagesForAlbum(albumId);
        const imageIds = images.map((img) => img.id);
        let selectionMap = new Map();
        let printMap = new Map();
        if (clientId) {
            const [rows] = await this.proofingDb.query(`SELECT image_id, state, print
         FROM client_selections
         WHERE client_id = ?`, [clientId]);
            const typedRows = rows;
            selectionMap = new Map(typedRows.map((row) => { var _a; return [Number(row.image_id), (_a = row.state) !== null && _a !== void 0 ? _a : null]; }));
            printMap = new Map(typedRows.map((row) => [Number(row.image_id), !!row.print]));
        }
        let replacements = new Map();
        if (imageIds.length) {
            const placeholders = imageIds.map(() => '?').join(',');
            const [rows] = await this.proofingDb.query(`SELECT original_image_id, edited_image_id
         FROM image_replacements
         WHERE original_image_id IN (${placeholders})`, imageIds);
            const typedRows = rows;
            for (const row of typedRows) {
                const editedImage = await this.kokenService.getImageById(Number(row.edited_image_id));
                replacements.set(Number(row.original_image_id), editedImage);
            }
        }
        const hideOriginalsWithEdits = (_a = options.hideOriginalsWithEdits) !== null && _a !== void 0 ? _a : false;
        const payload = [];
        images.forEach((img) => {
            var _a, _b, _c, _d, _e, _f, _g;
            const replacement = (_a = replacements.get(img.id)) !== null && _a !== void 0 ? _a : null;
            if (replacement && hideOriginalsWithEdits) {
                const replacementState = (_c = (_b = selectionMap.get(replacement.id)) !== null && _b !== void 0 ? _b : selectionMap.get(img.id)) !== null && _c !== void 0 ? _c : null;
                const replacementPrint = (_e = (_d = printMap.get(replacement.id)) !== null && _d !== void 0 ? _d : printMap.get(img.id)) !== null && _e !== void 0 ? _e : false;
                payload.push({
                    ...replacement,
                    state: replacementState,
                    print: replacementPrint,
                    edited: null,
                    isEditedReplacement: true,
                    original_image_id: img.id,
                    hasEditedReplacement: true,
                });
                return;
            }
            payload.push({
                ...img,
                state: (_f = selectionMap.get(img.id)) !== null && _f !== void 0 ? _f : null,
                print: (_g = printMap.get(img.id)) !== null && _g !== void 0 ? _g : false,
                edited: replacement,
                hasEditedReplacement: !!replacement,
                original_image_id: null,
                isEditedReplacement: false,
            });
        });
        return payload;
    }
    async getAllAlbumsWithCounts() {
        const albums = await this.kokenService.listAlbums();
        const albumIds = albums.map((a) => a.id);
        if (albumIds.length === 0)
            return [];
        const placeholders = albumIds.map(() => '?').join(',');
        const [rows] = await this.proofingDb.query(`SELECT album_id, COUNT(*) AS session_count
       FROM client_sessions
       WHERE album_id IN (${placeholders})
       GROUP BY album_id`, albumIds);
        const typedRows = rows;
        const counts = new Map(typedRows.map((r) => [Number(r.album_id), Number(r.session_count)]));
        return albums.map((album) => {
            var _a;
            return ({
                ...album,
                session_count: (_a = counts.get(album.id)) !== null && _a !== void 0 ? _a : 0,
            });
        });
    }
};
exports.AlbumsService = AlbumsService;
exports.AlbumsService = AlbumsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(database_config_1.PROOFING_DB)),
    __metadata("design:paramtypes", [koken_service_1.KokenService, Object])
], AlbumsService);
//# sourceMappingURL=albums.service.js.map