"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const admin_controller_1 = require("./admin.controller");
const admin_service_1 = require("./admin.service");
const admin_guard_1 = require("./guards/admin.guard");
const albums_module_1 = require("../albums/albums.module");
const database_module_1 = require("../database/database.module");
const sessions_module_1 = require("../sessions/sessions.module");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            database_module_1.DatabaseModule,
            sessions_module_1.SessionsModule,
            albums_module_1.AlbumsModule,
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => {
                    const secret = configService.get('ADMIN_JWT_SECRET');
                    if (!secret) {
                        throw new Error('ADMIN_JWT_SECRET must be configured for admin access.');
                    }
                    return {
                        secret,
                        signOptions: { expiresIn: '2h' }
                    };
                }
            })
        ],
        controllers: [admin_controller_1.AdminController],
        providers: [admin_service_1.AdminService, admin_guard_1.AdminGuard],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map