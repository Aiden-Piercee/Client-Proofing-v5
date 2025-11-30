import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'mysql2/promise';
import { KokenService, KokenImageRow } from '../koken/koken.service';
import { PROOFING_DB } from '../config/database.config';

@Injectable()
export class AlbumsService {
  constructor(
    private readonly kokenService: KokenService,

    @Inject(PROOFING_DB)
    private readonly proofingDb: Pool,
  ) {}

  listAlbums() {
    return this.kokenService.listAlbums();
  }

  getAlbum(id: number) {
    return this.kokenService.getAlbumById(id);
  }

  async listImagesForAlbum(
    albumId: number,
    clientId?: number,
  ): Promise<Array<KokenImageRow & { state: string | null; print: boolean; edited: any }>> {
    const images = await this.kokenService.listImagesForAlbum(albumId);
    const imageIds = images.map((img) => img.id);

    // --- Load client selections (state + print) ---
    let selectionMap = new Map<number, string>();
    let printMap = new Map<number, boolean>();

    if (clientId) {
      const [rows] = await this.proofingDb.query<any[]>(
        `SELECT image_id, state, print
         FROM client_selections
         WHERE client_id = ?`,
        [clientId],
      );

      selectionMap = new Map(rows.map((row) => [row.image_id, row.state]));
      printMap = new Map(rows.map((row) => [row.image_id, !!row.print]));
    }

    // --- Load image replacements (edited images) ---
    let replacements = new Map<number, any>();

    if (imageIds.length) {
      const placeholders = imageIds.map(() => '?').join(',');

      const [rows] = await this.proofingDb.query<any[]>(
        `SELECT original_image_id, edited_image_id
         FROM image_replacements
         WHERE original_image_id IN (${placeholders})`,
        imageIds,
      );

      for (const row of rows) {
        const editedImage = await this.kokenService.getImageById(
          row.edited_image_id,
        );
        replacements.set(row.original_image_id, editedImage);
      }
    }

    // --- Construct output ---
    return images.map((img) => ({
      ...img,
      state: selectionMap.get(img.id) ?? null,
      print: printMap.get(img.id) ?? false,      // NEW
      edited: replacements.get(img.id) ?? null,
    }));
  }

  /** Admin panel: album list INCLUDING session counts */
  async getAllAlbumsWithCounts() {
    const albums = await this.kokenService.listAlbums();
    const albumIds = albums.map((a) => a.id);

    if (albumIds.length === 0) return [];

    const placeholders = albumIds.map(() => '?').join(',');

    const [rows] = await this.proofingDb.query<any[]>(
      `SELECT album_id, COUNT(*) AS session_count
       FROM client_sessions
       WHERE album_id IN (${placeholders})
       GROUP BY album_id`,
      albumIds,
    );

    const counts = new Map(rows.map((r) => [r.album_id, r.session_count]));

    return albums.map((album) => ({
      ...album,
      session_count: counts.get(album.id) ?? 0,
    }));
  }
}
