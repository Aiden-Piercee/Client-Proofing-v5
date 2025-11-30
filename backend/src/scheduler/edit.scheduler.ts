import * as crypto from "crypto";
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Inject } from '@nestjs/common';
import { Pool } from 'mysql2/promise';
import { KOKEN_DB } from '../config/database.config';
import { RowDataPacket } from 'mysql2';

@Injectable()
export class EditScheduler {
  private readonly logger = new Logger(EditScheduler.name);

  constructor(
    @Inject(KOKEN_DB) private readonly kokenDb: Pool,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async detectEditedImages() {
    this.logger.log('Running edited image detection…');

    try {
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

        // TODO: Insert into image_replacements table
      }
    } catch (err) {
      this.logger.error('Error running edited image detection:', err);
    }
  }
}
