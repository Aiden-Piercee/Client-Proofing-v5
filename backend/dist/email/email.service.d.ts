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
export interface EditedAlbumDigestContext {
    email: string;
    clientName?: string | null;
    albumTitle?: string | null;
    sessionLinks: string[];
    landingLink?: string;
    previews?: PreviewAttachment[];
}
export interface PreviewAttachment {
    filename: string;
    path?: string;
    content?: string;
}
export interface ThankYouContext {
    email: string;
    clientName?: string | null;
    albumTitle?: string | null;
    previews?: PreviewAttachment[];
}
export declare class EmailService {
    private readonly logger;
    private readonly transporter;
    private readonly selfSignedFallback?;
    private readonly selfSignedEnabled;
    private readonly from;
    constructor(configService: ConfigService);
    sendMagicLink(context: MagicLinkContext): Promise<void>;
    sendEditedNotification(context: EditedNotificationContext): Promise<void>;
    sendEditedAlbumDigest(context: EditedAlbumDigestContext): Promise<void>;
    sendThankYouForEmailCapture(context: ThankYouContext): Promise<void>;
    private sendEmail;
    private normalizeAttachments;
    private createTransport;
    private isSelfSignedError;
}
