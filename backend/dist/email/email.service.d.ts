import { ConfigService } from '@nestjs/config';
export interface MagicLinkContext {
    email: string;
    clientName?: string;
    albumTitle?: string;
    link: string;
}
export interface EditedNotificationContext {
    email: string;
    originalId: number;
    editedId: number;
    albumTitle?: string;
}
export declare class EmailService {
    private readonly logger;
    private readonly transporter;
    private readonly from;
    constructor(configService: ConfigService);
    sendMagicLink(context: MagicLinkContext): Promise<void>;
    sendEditedNotification(context: EditedNotificationContext): Promise<void>;
    private sendEmail;
}
