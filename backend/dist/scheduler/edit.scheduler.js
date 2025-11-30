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
const database_config_1 = require("../config/database.config");
let EditScheduler = EditScheduler_1 = class EditScheduler {
    constructor(kokenDb) {
        this.kokenDb = kokenDb;
        this.logger = new common_1.Logger(EditScheduler_1.name);
    }
    async detectEditedImages() {
        this.logger.log('Running edited image detection…');
        try {
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
            }
        }
        catch (err) {
            this.logger.error('Error running edited image detection:', err);
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
    __metadata("design:paramtypes", [Object])
], EditScheduler);
//# sourceMappingURL=edit.scheduler.js.map