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
exports.SelectionsController = void 0;
const common_1 = require("@nestjs/common");
const selections_service_1 = require("./selections.service");
const sessions_service_1 = require("../sessions/sessions.service");
let SelectionsController = class SelectionsController {
    constructor(selectionsService, sessionsService) {
        this.selectionsService = selectionsService;
        this.sessionsService = sessionsService;
    }
    async updateSelection(sessionToken, imageId, state, print) {
        const session = await this.sessionsService.validateSession(sessionToken);
        if (!session.client_id) {
            throw new common_1.BadRequestException('Session is not linked to a client.');
        }
        if (state === null) {
            return this.selectionsService.clearSelection(session.client_id, imageId);
        }
        return this.selectionsService.upsertSelection(session.client_id, imageId, state, print);
    }
    async getSelections(sessionToken) {
        const session = await this.sessionsService.validateSession(sessionToken);
        if (!session.client_id) {
            throw new common_1.BadRequestException('Session is not linked to a client.');
        }
        return this.selectionsService.getSelectionsForClient(session.client_id);
    }
};
exports.SelectionsController = SelectionsController;
__decorate([
    (0, common_1.Post)(':sessionToken/:imageId'),
    __param(0, (0, common_1.Param)('sessionToken')),
    __param(1, (0, common_1.Param)('imageId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)('state')),
    __param(3, (0, common_1.Body)('print')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Object, Object]),
    __metadata("design:returntype", Promise)
], SelectionsController.prototype, "updateSelection", null);
__decorate([
    (0, common_1.Get)(':sessionToken'),
    __param(0, (0, common_1.Param)('sessionToken')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SelectionsController.prototype, "getSelections", null);
exports.SelectionsController = SelectionsController = __decorate([
    (0, common_1.Controller)('selections'),
    __metadata("design:paramtypes", [selections_service_1.SelectionsService,
        sessions_service_1.SessionsService])
], SelectionsController);
//# sourceMappingURL=selections.controller.js.map