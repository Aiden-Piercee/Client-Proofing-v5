import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'mysql2/promise';
import { KOKEN_DB, PROOFING_DB } from '../config/database.config';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { KokenService } from '../koken/koken.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class EditScheduler {
  private readonly logger = new Logger(EditScheduler.name);

  constructor(
    @Inject(KOKEN_DB) private readonly kokenDb: Pool,
    @Inject(PROOFING_DB) private readonly proofingDb: Pool,
    private readonly kokenService: KokenService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async detectEditedImages() {
    this.logger.log('Running edited image detection…');

    try {
      await this.ensureNotificationTable();

      // Look for Edited files
      const [rows] = await this.kokenDb.query<RowDataPacket[]>(
        `SELECT id, filename
         FROM koken_content
         WHERE filename LIKE '%-Edit.jpg'
           AND deleted = 0`
      );

      if (rows.length === 0) {
        this.logger.log('No edited images found.');
        return;
      }

      this.logger.log(`Found ${rows.length} edited images.`);

      for (const row of rows) {
        const editedFilename = row.filename;

        // original filename
        const originalFilename = editedFilename.replace('-Edit.jpg', '.jpg');

        const [origRows] = await this.kokenDb.query<RowDataPacket[]>(
          `SELECT id 
           FROM koken_content 
           WHERE filename = ? 
             AND deleted = 0 
           LIMIT 1`,
          [originalFilename]
        );

        if (origRows.length === 0) {
          this.logger.warn(
            `Edited image '${editedFilename}' has no matching original '${originalFilename}'.`
          );
          continue;
        }

        const originalId = origRows[0].id;
        const editedId = row.id;

        this.logger.log(
          `Mapping edited image ${editedId} → original ${originalId}`
        );

        const [existingReplacement] = await this.proofingDb.query<RowDataPacket[]>(
          `SELECT edited_image_id
           FROM image_replacements
           WHERE original_image_id = ?
           LIMIT 1`,
          [originalId]
        );

        let mappingChanged = false;

        if (existingReplacement.length) {
          const currentEditedId = existingReplacement[0].edited_image_id;

          if (currentEditedId === editedId) {
            this.logger.log(
              `Replacement already recorded for original ${originalId}; skipping insert.`,
            );
            continue;
          }

          const [updatedReplacement] = await this.proofingDb.query<ResultSetHeader>(
            `UPDATE image_replacements
             SET edited_image_id = ?
             WHERE original_image_id = ?`,
            [editedId, originalId]
          );
          void updatedReplacement;

          this.logger.log(
            `Updated replacement mapping: original ${originalId} → edited ${editedId}`,
          );
          mappingChanged = true;
        } else {
          const [insertedReplacement] = await this.proofingDb.query<ResultSetHeader>(
            `INSERT INTO image_replacements (original_image_id, edited_image_id)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE edited_image_id = VALUES(edited_image_id)`,
            [originalId, editedId]
          );
          void insertedReplacement;

          this.logger.log(
            `Inserted replacement mapping: original ${originalId} → edited ${editedId}`,
          );
          mappingChanged = true;
        }

        if (mappingChanged) {
          const albumIds = await this.findAlbumIdsForImage(originalId);
          await this.markAlbumsEdited(albumIds);
        }
      }

      await this.notifyIdleAlbums();
    } catch (err) {
      this.logger.error('Error running edited image detection:', err);
    }
  }

  private async ensureNotificationTable() {
    const [createdNotificationTable] = await this.proofingDb.query<ResultSetHeader>(
      `CREATE TABLE IF NOT EXISTS edit_notifications (
         album_id INT NOT NULL PRIMARY KEY,
         last_edit_detected_at DATETIME NOT NULL,
         last_notified_at DATETIME NULL,
         created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
         updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    );
    void createdNotificationTable;
  }

  private async findAlbumIdsForImage(imageId: number): Promise<number[]> {
    const [rows] = await this.kokenDb.query<RowDataPacket[]>(
      `SELECT album_id
       FROM koken_join_albums_content
       WHERE content_id = ?`,
      [imageId],
    );

    const typedRows = rows as Array<RowDataPacket & { album_id: number }>;
    return typedRows.map((row) => Number(row.album_id));
  }

  private async markAlbumsEdited(albumIds: number[]) {
    for (const albumId of albumIds) {
      const [marked] = await this.proofingDb.query<ResultSetHeader>(
        `INSERT INTO edit_notifications (album_id, last_edit_detected_at, last_notified_at)
         VALUES (?, NOW(), NULL)
         ON DUPLICATE KEY UPDATE last_edit_detected_at = GREATEST(last_edit_detected_at, VALUES(last_edit_detected_at))`,
        [albumId],
      );
      void marked;
    }
  }

  private async notifyIdleAlbums() {
    const [rows] = await this.proofingDb.query<RowDataPacket[]>(
      `SELECT album_id, last_edit_detected_at, last_notified_at
       FROM edit_notifications
       WHERE TIMESTAMPDIFF(MINUTE, last_edit_detected_at, NOW()) >= 30
         AND (last_notified_at IS NULL OR last_notified_at < last_edit_detected_at)`,
    );

    const candidates = rows as Array<
      RowDataPacket & {
        album_id: number;
        last_edit_detected_at: Date;
        last_notified_at: Date | null;
      }
    >;

    for (const row of candidates) {
      const albumId = Number(row.album_id);

      try {
        await this.sendEditedAlbumNotification(albumId);
        const [updatedNotification] = await this.proofingDb.query<ResultSetHeader>(
          `UPDATE edit_notifications
           SET last_notified_at = NOW()
           WHERE album_id = ?`,
          [albumId],
        );
        void updatedNotification;
      } catch (err) {
        this.logger.error(
          `Failed notifying clients for album ${albumId}`,
          err as Error,
        );
      }
    }
  }

  private getBaseUrl() {
    const configuredBase =
      this.configService.get<string>('CLIENT_PROOFING_URL') ||
      this.configService.get<string>('FRONTEND_URL') ||
      '';

    return configuredBase.replace(/\/$/, '');
  }

  private async sendEditedAlbumNotification(albumId: number) {
    const album = await this.kokenService.getAlbumById(albumId);
    const baseUrl = this.getBaseUrl();

    const [sessionRows] = await this.proofingDb.query<RowDataPacket[]>(
      `SELECT cs.token, cs.client_name, cs.client_id, cs.email AS session_email, c.email AS client_email
       FROM client_sessions cs
       LEFT JOIN clients c ON c.id = cs.client_id
       LEFT JOIN client_session_albums csa ON csa.session_id = cs.id
       WHERE cs.album_id = ? OR csa.album_id = ?`,
      [albumId, albumId],
    );

    const typedRows = sessionRows as Array<
      RowDataPacket & {
        token: string;
        client_name: string | null;
        client_id: number | null;
        session_email: string | null;
        client_email: string | null;
      }
    >;

    const recipients = new Map<
      string,
      { clientName: string | null; sessionLinks: string[]; landingLink?: string }
    >();

    typedRows.forEach((row) => {
      const emailCandidate = `${row.client_email ?? row.session_email ?? ''}`.trim();
      if (!emailCandidate) {
        return;
      }

      const magicLink = `${baseUrl}/proofing/${albumId}/client/${row.token}`;
      const landingLink = `${baseUrl}/proofing/landing/${row.token}`;

      const entry =
        recipients.get(emailCandidate) ??
        {
          clientName: row.client_name ?? null,
          sessionLinks: [],
          landingLink,
        };

      entry.sessionLinks.push(magicLink);
      if (!entry.landingLink) {
        entry.landingLink = landingLink;
      }

      recipients.set(emailCandidate, entry);
    });

    for (const [email, value] of recipients.entries()) {
      await this.emailService.sendEditedAlbumDigest({
        email,
        clientName: value.clientName ?? null,
        albumTitle: album.title ?? undefined,
        sessionLinks: Array.from(new Set(value.sessionLinks)),
        landingLink: value.landingLink,
      });
    }
  }
}
