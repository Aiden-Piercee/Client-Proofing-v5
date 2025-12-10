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
var EditScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const common_2 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const database_config_1 = require("../config/database.config");
const koken_service_1 = require("../koken/koken.service");
const email_service_1 = require("../email/email.service");
let EditScheduler = EditScheduler_1 = class EditScheduler {
    constructor(kokenDb, proofingDb, kokenService, emailService, configService) {
        this.kokenDb = kokenDb;
        this.proofingDb = proofingDb;
        this.kokenService = kokenService;
        this.emailService = emailService;
        this.configService = configService;
        this.logger = new common_1.Logger(EditScheduler_1.name);
    }
    async detectEditedImages() {
        this.logger.log('Running edited image detection…');
        try {
            await this.ensureNotificationTable();
            const [rows] = await this.kokenDb.query(`SELECT id, filename
         FROM koken_content
         WHERE filename LIKE '%-Edit.jpg'
           AND deleted = 0`);
            if (rows.length === 0) {
                this.logger.log('No edited images found.');
                return;
            }
            this.logger.log(`Found ${rows.length} edited images.`);
            for (const row of rows) {
                const editedFilename = row.filename;
                const originalFilename = editedFilename.replace('-Edit.jpg', '.jpg');
                const [origRows] = await this.kokenDb.query(`SELECT id 
           FROM koken_content 
           WHERE filename = ? 
             AND deleted = 0 
           LIMIT 1`, [originalFilename]);
                if (origRows.length === 0) {
                    this.logger.warn(`Edited image '${editedFilename}' has no matching original '${originalFilename}'.`);
                    continue;
                }
                const originalId = origRows[0].id;
                const editedId = row.id;
                this.logger.log(`Mapping edited image ${editedId} → original ${originalId}`);
                const [existingReplacement] = await this.proofingDb.query(`SELECT edited_image_id
           FROM image_replacements
           WHERE original_image_id = ?
           LIMIT 1`, [originalId]);
                let mappingChanged = false;
                if (existingReplacement.length) {
                    const currentEditedId = existingReplacement[0].edited_image_id;
                    if (currentEditedId === editedId) {
                        this.logger.log(`Replacement already recorded for original ${originalId}; skipping insert.`);
                        continue;
                    }
                    const [updatedReplacement] = await this.proofingDb.query(`UPDATE image_replacements
             SET edited_image_id = ?
             WHERE original_image_id = ?`, [editedId, originalId]);
                    void updatedReplacement;
                    this.logger.log(`Updated replacement mapping: original ${originalId} → edited ${editedId}`);
                    mappingChanged = true;
                }
                else {
                    const [insertedReplacement] = await this.proofingDb.query(`INSERT INTO image_replacements (original_image_id, edited_image_id)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE edited_image_id = VALUES(edited_image_id)`, [originalId, editedId]);
                    void insertedReplacement;
                    this.logger.log(`Inserted replacement mapping: original ${originalId} → edited ${editedId}`);
                    mappingChanged = true;
                }
                if (mappingChanged) {
                    const albumIds = await this.findAlbumIdsForImage(originalId);
                    await this.markAlbumsEdited(albumIds);
                }
            }
            await this.notifyIdleAlbums();
        }
        catch (err) {
            this.logger.error('Error running edited image detection:', err);
        }
    }
    async ensureNotificationTable() {
        const [createdNotificationTable] = await this.proofingDb.query(`CREATE TABLE IF NOT EXISTS edit_notifications (
         album_id INT NOT NULL PRIMARY KEY,
         last_edit_detected_at DATETIME NOT NULL,
         last_notified_at DATETIME NULL,
         created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
         updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
        void createdNotificationTable;
    }
    async findAlbumIdsForImage(imageId) {
        const [rows] = await this.kokenDb.query(`SELECT album_id
       FROM koken_join_albums_content
       WHERE content_id = ?`, [imageId]);
        const typedRows = rows;
        return typedRows.map((row) => Number(row.album_id));
    }
    async markAlbumsEdited(albumIds) {
        for (const albumId of albumIds) {
            const [marked] = await this.proofingDb.query(`INSERT INTO edit_notifications (album_id, last_edit_detected_at, last_notified_at)
         VALUES (?, NOW(), NULL)
         ON DUPLICATE KEY UPDATE last_edit_detected_at = GREATEST(last_edit_detected_at, VALUES(last_edit_detected_at))`, [albumId]);
            void marked;
        }
    }
    async notifyIdleAlbums() {
        const [rows] = await this.proofingDb.query(`SELECT album_id, last_edit_detected_at, last_notified_at
       FROM edit_notifications
       WHERE TIMESTAMPDIFF(MINUTE, last_edit_detected_at, NOW()) >= 30
         AND (last_notified_at IS NULL OR last_notified_at < last_edit_detected_at)`);
        const candidates = rows;
        for (const row of candidates) {
            const albumId = Number(row.album_id);
            try {
                await this.sendEditedAlbumNotification(albumId);
                const [updatedNotification] = await this.proofingDb.query(`UPDATE edit_notifications
           SET last_notified_at = NOW()
           WHERE album_id = ?`, [albumId]);
                void updatedNotification;
            }
            catch (err) {
                this.logger.error(`Failed notifying clients for album ${albumId}`, err);
            }
        }
    }
    getBaseUrl() {
        const configuredBase = this.configService.get('CLIENT_PROOFING_URL') ||
            this.configService.get('FRONTEND_URL') ||
            '';
        return configuredBase.replace(/\/$/, '');
    }
    async sendEditedAlbumNotification(albumId) {
        var _a, _b;
        const album = await this.kokenService.getAlbumById(albumId);
        const baseUrl = this.getBaseUrl();
        const previews = await this.buildAlbumPreviewAttachments(albumId);
        const [sessionRows] = await this.proofingDb.query(`SELECT cs.token, cs.client_name, cs.client_id, c.email AS client_email
       FROM client_sessions cs
       LEFT JOIN clients c ON c.id = cs.client_id
       LEFT JOIN client_session_albums csa ON csa.session_id = cs.id
       WHERE cs.album_id = ? OR csa.album_id = ?`, [albumId, albumId]);
        const typedRows = sessionRows;
        const recipients = new Map();
        typedRows.forEach((row) => {
            var _a, _b, _c;
            const emailCandidate = `${(_a = row.client_email) !== null && _a !== void 0 ? _a : ''}`.trim();
            if (!emailCandidate) {
                return;
            }
            const magicLink = `${baseUrl}/proofing/${albumId}/client/${row.token}`;
            const landingLink = `${baseUrl}/proofing/landing/${row.token}`;
            const entry = (_b = recipients.get(emailCandidate)) !== null && _b !== void 0 ? _b : {
                clientName: (_c = row.client_name) !== null && _c !== void 0 ? _c : null,
                sessionLinks: [],
                landingLink,
            };
            entry.sessionLinks.push(magicLink);
            if (!entry.landingLink) {
                entry.landingLink = landingLink;
            }
            recipients.set(emailCandidate, entry);
        });
        for (const [email, value] of recipients.entries()) {
            await this.emailService.sendEditedAlbumDigest({
                email,
                clientName: (_a = value.clientName) !== null && _a !== void 0 ? _a : null,
                albumTitle: (_b = album.title) !== null && _b !== void 0 ? _b : undefined,
                sessionLinks: Array.from(new Set(value.sessionLinks)),
                landingLink: value.landingLink,
                previews,
            });
        }
    }
    async buildAlbumPreviewAttachments(albumId) {
        try {
            const images = await this.kokenService.listImagesForAlbum(albumId);
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
};
exports.EditScheduler = EditScheduler;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_10_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EditScheduler.prototype, "detectEditedImages", null);
exports.EditScheduler = EditScheduler = EditScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_2.Inject)(database_config_1.KOKEN_DB)),
    __param(1, (0, common_2.Inject)(database_config_1.PROOFING_DB)),
    __metadata("design:paramtypes", [Object, Object, koken_service_1.KokenService,
        email_service_1.EmailService,
        config_1.ConfigService])
], EditScheduler);
//# sourceMappingURL=edit.scheduler.js.map