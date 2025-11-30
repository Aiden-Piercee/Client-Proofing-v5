"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const database_config_1 = require("./config/database.config");
const koken_module_1 = require("./koken/koken.module");
const albums_module_1 = require("./albums/albums.module");
const images_module_1 = require("./images/images.module");
const clients_module_1 = require("./clients/clients.module");
const selections_module_1 = require("./selections/selections.module");
const sync_module_1 = require("./sync/sync.module");
const database_module_1 = require("./database/database.module");
const sessions_module_1 = require("./sessions/sessions.module");
const email_module_1 = require("./email/email.module");
const scheduler_module_1 = require("./scheduler/scheduler.module");
const admin_module_1 = require("./admin/admin.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: [
                    __dirname + '/../.env',
                    '.env'
                ],
                load: [database_config_1.default],
            }),
            schedule_1.ScheduleModule.forRoot(),
            database_module_1.DatabaseModule,
            email_module_1.EmailModule,
            koken_module_1.KokenModule,
            albums_module_1.AlbumsModule,
            images_module_1.ImagesModule,
            clients_module_1.ClientsModule,
            selections_module_1.SelectionsModule,
            sessions_module_1.SessionsModule,
            sync_module_1.SyncModule,
            admin_module_1.AdminModule,
            scheduler_module_1.SchedulerModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map