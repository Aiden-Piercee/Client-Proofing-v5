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
exports.SelectionsService = void 0;
const common_1 = require("@nestjs/common");
const database_config_1 = require("../config/database.config");
let SelectionsService = class SelectionsService {
    constructor(proofingDb) {
        this.proofingDb = proofingDb;
    }
    async clearSelection(clientId, imageId) {
        await this.proofingDb.query(`DELETE FROM client_selections WHERE client_id = ? AND image_id = ?`, [clientId, imageId]);
        return { clientId, imageId, state: null, print: false };
    }
    async upsertSelection(clientId, imageId, state, print) {
        if (!clientId) {
            throw new Error('Client ID is required for selections');
        }
        const [rows] = await this.proofingDb.query(`SELECT state, print
       FROM client_selections
       WHERE client_id = ? AND image_id = ?`, [clientId, imageId]);
        let current = rows[0] || { state: null, print: 0 };
        if (state === 'rejected') {
            current.print = 0;
        }
        if (print !== undefined) {
            if (state !== 'rejected' && current.state !== 'rejected') {
                current.print = print ? 1 : 0;
            }
        }
        if (state !== undefined) {
            current.state = state;
        }
        await this.proofingDb.query(`
      INSERT INTO client_selections (client_id, image_id, state, print, updated_at)
      VALUES (?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        state = VALUES(state),
        print = VALUES(print),
        updated_at = NOW()
    `, [clientId, imageId, current.state, current.print]);
        return {
            clientId,
            imageId,
            state: current.state,
            print: !!current.print,
        };
    }
    async getSelectionsForClient(clientId) {
        const [rows] = await this.proofingDb.query(`SELECT image_id, state, print
       FROM client_selections
       WHERE client_id = ?`, [clientId]);
        return rows.map((row) => ({
            imageId: row.image_id,
            state: row.state,
            print: !!row.print,
        }));
    }
};
exports.SelectionsService = SelectionsService;
exports.SelectionsService = SelectionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_config_1.PROOFING_DB)),
    __metadata("design:paramtypes", [Object])
], SelectionsService);
//# sourceMappingURL=selections.service.js.map