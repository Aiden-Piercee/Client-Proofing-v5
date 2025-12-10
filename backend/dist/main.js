"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const config_1 = require("@nestjs/config");
const nodeCrypto = require("crypto");
async function bootstrap() {
    if (!global.crypto) {
        global.crypto = nodeCrypto;
    }
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const config = app.get(config_1.ConfigService);
    const port = config.get('PORT', 3700);
    app.enableCors({ origin: true });
    await app.listen(port);
    console.log(`Client proofing API running on port ${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map