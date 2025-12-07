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
const nodemailer_1 = require("nodemailer");
let EmailService = EmailService_1 = class EmailService {
    constructor(configService) {
        var _a, _b, _c;
        this.logger = new common_1.Logger(EmailService_1.name);
        const mailer = (_a = nodemailer_1.default) !== null && _a !== void 0 ? _a : require('nodemailer');
        if (!mailer || !mailer.createTransport) {
            throw new Error('Nodemailer is not available to create a transport');
        }
        const host = configService.get('SMTP_HOST');
        const port = Number((_b = configService.get('SMTP_PORT')) !== null && _b !== void 0 ? _b : 587);
        const user = configService.get('SMTP_USER');
        const pass = configService.get('SMTP_PASS');
        this.from =
            (_c = configService.get('SMTP_FROM')) !== null && _c !== void 0 ? _c : 'no-reply@clientproofing.local';
        this.transporter = mailer.createTransport({
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
    async sendEditedAlbumDigest(context) {
        var _a, _b;
        const header = `Hello ${(_a = context.clientName) !== null && _a !== void 0 ? _a : 'there'},` +
            `\n\n` +
            `Edited photos are now available for ${(_b = context.albumTitle) !== null && _b !== void 0 ? _b : 'your gallery'}.`;
        const links = context.sessionLinks.map((link, idx) => `  ${idx + 1}. ${link}`);
        const landing = context.landingLink
            ? [``, `Landing page: ${context.landingLink}`]
            : [];
        const attachments = this.normalizeAttachments(context.previews);
        const body = [
            header,
            '',
            'Use your magic link(s) below to view the new edits:',
            ...links,
            ...landing,
            '',
            'These were sent after no new edits were detected for 30 minutes.',
        ].join('\n');
        await this.sendEmail({
            to: context.email,
            subject: 'Edited photos are ready to review',
            text: body,
            attachments,
        });
    }
    async sendThankYouForEmailCapture(context) {
        var _a, _b, _c;
        const greeting = `Hello ${(_a = context.clientName) !== null && _a !== void 0 ? _a : 'there'},\n\n`;
        const intro = `Thank you for sharing your email for ${(_b = context.albumTitle) !== null && _b !== void 0 ? _b : 'your gallery'}. ` +
            `We will notify you as soon as your edited photos are completed and ready for download.`;
        const previewLine = ((_c = context.previews) === null || _c === void 0 ? void 0 : _c.length)
            ? '\n\nWe have attached a few filenames and thumbnails as a quick preview.'
            : '';
        const closing = '\n\nYou will receive an update after editing finishes (including the 30-minute checks).';
        const attachments = this.normalizeAttachments(context.previews);
        await this.sendEmail({
            to: context.email,
            subject: 'Thank you – we will notify you when edits are ready',
            text: `${greeting}${intro}${previewLine}${closing}`,
            attachments,
        });
    }
    async sendEmail(options) {
        try {
            await this.transporter.sendMail({
                from: this.from,
                to: options.to,
                subject: options.subject,
                text: options.text,
                attachments: options.attachments,
            });
            this.logger.log(`Sent email to ${options.to}: ${options.subject}`);
        }
        catch (err) {
            this.logger.error(`Failed sending email to ${options.to}`, err);
            throw err;
        }
    }
    normalizeAttachments(previews) {
        if (!previews || previews.length === 0) {
            return undefined;
        }
        return previews
            .filter((preview) => preview.filename && (preview.path || preview.content))
            .map((preview) => {
            var _a;
            return ({
                filename: preview.filename,
                path: (_a = preview.path) !== null && _a !== void 0 ? _a : undefined,
                content: preview.content,
            });
        });
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map