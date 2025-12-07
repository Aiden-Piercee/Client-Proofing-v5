import { ConfigService } from '@nestjs/config';
import { Pool } from 'mysql2/promise';
import { KokenService } from '../koken/koken.service';
import { EmailService } from '../email/email.service';
export declare class EditScheduler {
    private readonly kokenDb;
    private readonly proofingDb;
    private readonly kokenService;
    private readonly emailService;
    private readonly configService;
    private readonly logger;
    constructor(kokenDb: Pool, proofingDb: Pool, kokenService: KokenService, emailService: EmailService, configService: ConfigService);
    detectEditedImages(): Promise<void>;
    private ensureNotificationTable;
    private findAlbumIdsForImage;
    private markAlbumsEdited;
    private notifyIdleAlbums;
    private getBaseUrl;
    private sendEditedAlbumNotification;
    private buildAlbumPreviewAttachments;
}
