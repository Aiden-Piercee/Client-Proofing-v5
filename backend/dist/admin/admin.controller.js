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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const admin_service_1 = require("./admin.service");
const admin_guard_1 = require("./guards/admin.guard");
class LoginDto {
}
class AlbumIdParam {
}
class CreateSessionDto {
}
class GenerateTokenDto {
}
class TokenParam {
}
class SessionParam {
}
class UpdateSessionDto {
}
class UpdateClientDto {
}
class ClientParam {
}
let AdminController = class AdminController {
    constructor(adminService) {
        this.adminService = adminService;
    }
    async login(body) {
        return this.adminService.login(body.username, body.password);
    }
    async getAlbums() {
        return this.adminService.getAlbums();
    }
    async getAlbum(params) {
        return this.adminService.getAlbum(Number(params.id));
    }
    async createSession(body) {
        return this.adminService.createAnonymousSession(body.album_id);
    }
    async listSessions() {
        return this.adminService.listSessions();
    }
    async listManagedTokens() {
        return this.adminService.listSessions();
    }
    async listTokenResources() {
        return this.adminService.listTokenResources();
    }
    async listHousekeeping() {
        return this.adminService.listHousekeeping();
    }
    async listClients() {
        return this.adminService.listClientsWithAlbums();
    }
    async generateManagedToken(body) {
        var _a, _b, _c;
        return this.adminService.generateManagedToken({
            albumIds: (_a = body.album_ids) !== null && _a !== void 0 ? _a : (body.album_id ? [body.album_id] : []),
            clientId: body.client_id,
            clientName: (_b = body.client_name) !== null && _b !== void 0 ? _b : null,
            email: (_c = body.email) !== null && _c !== void 0 ? _c : null,
        });
    }
    async addAlbumToToken(params, body) {
        if (body.album_ids && body.album_ids.length > 0) {
            return this.adminService.linkAlbumsToSessionToken(params.token, body.album_ids);
        }
        return this.adminService.linkAlbumToSessionToken(params.token, Number(body.album_id));
    }
    async removeSession(params) {
        return this.adminService.removeSession(Number(params.sessionId));
    }
    async updateSession(params, body) {
        return this.adminService.updateSessionDetails(Number(params.sessionId), {
            albumId: body.album_id,
            clientId: body.client_id,
            clientName: body.client_name,
            clientEmail: body.client_email,
        });
    }
    async updateClient(params, body) {
        var _a, _b;
        return this.adminService.updateClientDetails(Number(params.clientId), {
            name: (_a = body.name) !== null && _a !== void 0 ? _a : null,
            email: (_b = body.email) !== null && _b !== void 0 ? _b : null,
        });
    }
    async updateSessionForHousekeeping(params, body) {
        return this.adminService.updateSessionDetails(Number(params.sessionId), {
            albumId: body.album_id,
            clientId: body.client_id,
            clientName: body.client_name,
            clientEmail: body.client_email,
            token: body.token,
        });
    }
    async deleteSessionForHousekeeping(params) {
        return this.adminService.removeSession(Number(params.sessionId));
    }
    async updateClientForHousekeeping(params, body) {
        var _a, _b;
        return this.adminService.updateClientDetails(Number(params.clientId), {
            name: (_a = body.name) !== null && _a !== void 0 ? _a : null,
            email: (_b = body.email) !== null && _b !== void 0 ? _b : null,
        });
    }
    async deleteClientForHousekeeping(params) {
        return this.adminService.removeClient(Number(params.clientId));
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [LoginDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "login", null);
__decorate([
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    (0, common_1.Get)('albums'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAlbums", null);
__decorate([
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    (0, common_1.Get)('albums/:id'),
    __param(0, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [AlbumIdParam]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAlbum", null);
__decorate([
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    (0, common_1.Post)('session/create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateSessionDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createSession", null);
__decorate([
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    (0, common_1.Get)('sessions'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listSessions", null);
__decorate([
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    (0, common_1.Get)('token-management'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listManagedTokens", null);
__decorate([
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    (0, common_1.Get)('token-management/resources'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listTokenResources", null);
__decorate([
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    (0, common_1.Get)('housekeeping'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listHousekeeping", null);
__decorate([
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    (0, common_1.Get)('clients'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listClients", null);
__decorate([
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    (0, common_1.Post)('token-management/generate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [GenerateTokenDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "generateManagedToken", null);
__decorate([
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    (0, common_1.Post)('token-management/:token/albums'),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TokenParam, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "addAlbumToToken", null);
__decorate([
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    (0, common_1.Delete)('token-management/session/:sessionId'),
    __param(0, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SessionParam]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "removeSession", null);
__decorate([
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    (0, common_1.Patch)('token-management/session/:sessionId'),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SessionParam,
        UpdateSessionDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateSession", null);
__decorate([
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    (0, common_1.Patch)('token-management/client/:clientId'),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ClientParam,
        UpdateClientDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateClient", null);
__decorate([
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    (0, common_1.Patch)('housekeeping/session/:sessionId'),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SessionParam,
        UpdateSessionDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateSessionForHousekeeping", null);
__decorate([
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    (0, common_1.Delete)('housekeeping/session/:sessionId'),
    __param(0, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SessionParam]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteSessionForHousekeeping", null);
__decorate([
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    (0, common_1.Patch)('housekeeping/client/:clientId'),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ClientParam,
        UpdateClientDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateClientForHousekeeping", null);
__decorate([
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    (0, common_1.Delete)('housekeeping/client/:clientId'),
    __param(0, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ClientParam]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteClientForHousekeeping", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map