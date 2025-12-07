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
exports.SessionsController = void 0;
const common_1 = require("@nestjs/common");
const sessions_service_1 = require("./sessions.service");
let SessionsController = class SessionsController {
    constructor(service) {
        this.service = service;
    }
    async createSession(body) {
        const { albumId, email, clientName, sendEmail, albumTitle } = body;
        if (sendEmail) {
            return this.service.sendMagicLink(albumId, email, clientName, albumTitle);
        }
        const token = await this.service.createSession(albumId, email, clientName);
        return { token };
    }
    async sendMagic(body) {
        const { albumId, email, clientName, albumTitle } = body;
        return this.service.sendMagicLink(albumId, email, clientName, albumTitle);
    }
    async landing(token) {
        return this.service.getClientLanding(token);
    }
    async validate(token) {
        return this.service.validateSession(token);
    }
    async attachEmail(token, body) {
        return this.service.attachEmailToSession(token, body.email, body.clientName);
    }
};
exports.SessionsController = SessionsController;
__decorate([
    (0, common_1.Post)('session/create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "createSession", null);
__decorate([
    (0, common_1.Post)('session/magic'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "sendMagic", null);
__decorate([
    (0, common_1.Get)('session/:token/albums'),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "landing", null);
__decorate([
    (0, common_1.Get)('session/:token'),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "validate", null);
__decorate([
    (0, common_1.Post)('session/:token/email'),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "attachEmail", null);
exports.SessionsController = SessionsController = __decorate([
    (0, common_1.Controller)('client'),
    __metadata("design:paramtypes", [sessions_service_1.SessionsService])
], SessionsController);
//# sourceMappingURL=sessions.controller.js.map