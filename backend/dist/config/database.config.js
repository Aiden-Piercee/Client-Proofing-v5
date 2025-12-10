"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KOKEN_DB = exports.PROOFING_DB = void 0;
const config_1 = require("@nestjs/config");
exports.PROOFING_DB = 'PROOFING_DB_CONNECTION';
exports.KOKEN_DB = 'KOKEN_DB_CONNECTION';
exports.default = (0, config_1.registerAs)('database', () => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    return ({
        proofing: {
            host: (_a = process.env.PROOFING_DB_HOST) !== null && _a !== void 0 ? _a : 'localhost',
            port: Number((_b = process.env.PROOFING_DB_PORT) !== null && _b !== void 0 ? _b : 3306),
            user: (_c = process.env.PROOFING_DB_USER) !== null && _c !== void 0 ? _c : 'root',
            password: (_d = process.env.PROOFING_DB_PASSWORD) !== null && _d !== void 0 ? _d : '',
            database: (_e = process.env.PROOFING_DB_NAME) !== null && _e !== void 0 ? _e : 'proofing_db'
        },
        koken: {
            host: (_f = process.env.KOKEN_DB_HOST) !== null && _f !== void 0 ? _f : 'localhost',
            port: Number((_g = process.env.KOKEN_DB_PORT) !== null && _g !== void 0 ? _g : 3306),
            user: (_h = process.env.KOKEN_DB_USER) !== null && _h !== void 0 ? _h : 'root',
            password: (_j = process.env.KOKEN_DB_PASSWORD) !== null && _j !== void 0 ? _j : '',
            database: (_k = process.env.KOKEN_DB_NAME) !== null && _k !== void 0 ? _k : 'koken_db'
        }
    });
});
//# sourceMappingURL=database.config.js.map