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
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = require("nodemailer");
let EmailService = EmailService_1 = class EmailService {
    constructor(configService) {
        var _a, _b;
        this.logger = new common_1.Logger(EmailService_1.name);
        const host = configService.get('SMTP_HOST');
        const port = Number((_a = configService.get('SMTP_PORT')) !== null && _a !== void 0 ? _a : 587);
        const user = configService.get('SMTP_USER');
        const pass = configService.get('SMTP_PASS');
        this.from =
            (_b = configService.get('SMTP_FROM')) !== null && _b !== void 0 ? _b : 'no-reply@clientproofing.local';
        this.transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: user && pass ? { user, pass } : undefined,
        });
    }
    async sendMagicLink(context) {
        var _a, _b;
        const body = `Hello ${(_a = context.clientName) !== null && _a !== void 0 ? _a : 'there'},\n\n` +
            `You can access your ${(_b = context.albumTitle) !== null && _b !== void 0 ? _b : 'album'} proofing gallery using the link below:\n` +
            `${context.link}\n\n` +
            `This link is unique to your email address and will expire automatically.`;
        await this.sendEmail({
            to: context.email,
            subject: 'Your proofing link',
            text: body,
        });
    }
    async sendEditedNotification(context) {
        var _a;
        const lines = [
            `New edited photo available for ${(_a = context.albumTitle) !== null && _a !== void 0 ? _a : 'your album'}.`,
            `Original image ID: ${context.originalId}.`,
            `Edited image ID: ${context.editedId}.`,
            '',
            'Visit your proofing link to view the updated image.',
        ];
        await this.sendEmail({
            to: context.email,
            subject: 'Edited photo available',
            text: lines.join('\n'),
        });
    }
    async sendEmail(options) {
        try {
            await this.transporter.sendMail({
                from: this.from,
                to: options.to,
                subject: options.subject,
                text: options.text,
            });
            this.logger.log(`Sent email to ${options.to}: ${options.subject}`);
        }
        catch (err) {
            this.logger.error(`Failed sending email to ${options.to}`, err);
            throw err;
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map