"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const promise_1 = require("mysql2/promise");
const database_config_1 = require("../config/database.config");
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        providers: [
            {
                provide: database_config_1.PROOFING_DB,
                inject: [config_1.ConfigService],
                useFactory: async (configService) => {
                    var _a;
                    const settings = (_a = configService.get('database')) === null || _a === void 0 ? void 0 : _a.proofing;
                    if (!settings) {
                        throw new Error('Missing proofing database configuration.');
                    }
                    return (0, promise_1.createPool)({
                        host: settings.host,
                        port: settings.port,
                        user: settings.user,
                        password: settings.password,
                        database: settings.database,
                        waitForConnections: true,
                        connectionLimit: 10
                    });
                }
            },
            {
                provide: database_config_1.KOKEN_DB,
                inject: [config_1.ConfigService],
                useFactory: async (configService) => {
                    var _a;
                    const settings = (_a = configService.get('database')) === null || _a === void 0 ? void 0 : _a.koken;
                    if (!settings) {
                        throw new Error('Missing Koken database configuration.');
                    }
                    return (0, promise_1.createPool)({
                        host: settings.host,
                        port: settings.port,
                        user: settings.user,
                        password: settings.password,
                        database: settings.database,
                        waitForConnections: true,
                        connectionLimit: 10
                    });
                }
            }
        ],
        exports: [database_config_1.PROOFING_DB, database_config_1.KOKEN_DB]
    })
], DatabaseModule);
//# sourceMappingURL=database.module.js.map