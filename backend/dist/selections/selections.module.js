"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelectionsModule = void 0;
const common_1 = require("@nestjs/common");
const selections_controller_1 = require("./selections.controller");
const selections_service_1 = require("./selections.service");
const sessions_module_1 = require("../sessions/sessions.module");
let SelectionsModule = class SelectionsModule {
};
exports.SelectionsModule = SelectionsModule;
exports.SelectionsModule = SelectionsModule = __decorate([
    (0, common_1.Module)({
        imports: [sessions_module_1.SessionsModule],
        controllers: [selections_controller_1.SelectionsController],
        providers: [selections_service_1.SelectionsService]
    })
], SelectionsModule);
//# sourceMappingURL=selections.module.js.map