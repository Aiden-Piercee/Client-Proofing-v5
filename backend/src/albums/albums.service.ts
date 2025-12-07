import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'mysql2/promise';
import { RowDataPacket } from 'mysql2';
import { KokenService, KokenImageRow } from '../koken/koken.service';
import { PROOFING_DB } from '../config/database.config';

type AlbumImage = KokenImageRow & {
  state: string | null;
  print: boolean;
  edited: any;
  isEditedReplacement?: boolean;
  original_image_id?: number | null;
  hasEditedReplacement?: boolean;
};

interface ListImageOptions {
  hideOriginalsWithEdits?: boolean;
}

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
    options: ListImageOptions = {},
  ): Promise<AlbumImage[]> {
    const images = await this.kokenService.listImagesForAlbum(albumId);
    const imageIds = images.map((img) => img.id);

    // --- Load client selections (state + print) ---
    let selectionMap = new Map<number, string | null>();
    let printMap = new Map<number, boolean>();

    if (clientId) {
      const [rows] = await this.proofingDb.query<RowDataPacket[]>(
        `SELECT image_id, state, print
         FROM client_selections
         WHERE client_id = ?`,
        [clientId],
      );

      const typedRows = rows as Array<RowDataPacket & { image_id: number; state: string | null; print: number | null }>;

      selectionMap = new Map(
        typedRows.map((row) => [Number(row.image_id), row.state ?? null]),
      );
      printMap = new Map(
        typedRows.map((row) => [Number(row.image_id), !!row.print]),
      );
    }

    // --- Load image replacements (edited images) ---
    let replacements = new Map<number, any>();

    if (imageIds.length) {
      const placeholders = imageIds.map(() => '?').join(',');

      const [rows] = await this.proofingDb.query<RowDataPacket[]>(
        `SELECT original_image_id, edited_image_id
         FROM image_replacements
         WHERE original_image_id IN (${placeholders})`,
        imageIds,
      );

      const typedRows = rows as Array<RowDataPacket & { original_image_id: number; edited_image_id: number }>;

      for (const row of typedRows) {
        const editedImage = await this.kokenService.getImageById(
          Number(row.edited_image_id),
        );
        replacements.set(Number(row.original_image_id), editedImage);
      }
    }

    const hideOriginalsWithEdits = options.hideOriginalsWithEdits ?? false;

    const payload: AlbumImage[] = [];

    images.forEach((img) => {
      const replacement = replacements.get(img.id) ?? null;

      if (replacement && hideOriginalsWithEdits) {
        const replacementState =
          selectionMap.get(replacement.id) ?? selectionMap.get(img.id) ?? null;
        const replacementPrint =
          printMap.get(replacement.id) ?? printMap.get(img.id) ?? false;

        payload.push({
          ...replacement,
          state: replacementState,
          print: replacementPrint,
          edited: null,
          isEditedReplacement: true,
          original_image_id: img.id,
          hasEditedReplacement: true,
        });
        return;
      }

      payload.push({
        ...img,
        state: selectionMap.get(img.id) ?? null,
        print: printMap.get(img.id) ?? false,
        edited: replacement,
        hasEditedReplacement: !!replacement,
        original_image_id: null,
        isEditedReplacement: false,
      });
    });

    return payload;
  }

  /** Admin panel: album list INCLUDING session counts */
  async getAllAlbumsWithCounts() {
    const albums = await this.kokenService.listAlbums();
    const albumIds = albums.map((a) => a.id);

    if (albumIds.length === 0) return [];

    const placeholders = albumIds.map(() => '?').join(',');

    const [rows] = await this.proofingDb.query<RowDataPacket[]>(
      `SELECT album_id, COUNT(*) AS session_count
       FROM client_sessions
       WHERE album_id IN (${placeholders})
       GROUP BY album_id`,
      albumIds,
    );

    const typedRows = rows as Array<
      RowDataPacket & { album_id: number; session_count: number }
    >;

    const counts = new Map(
      typedRows.map((r) => [Number(r.album_id), Number(r.session_count)]),
    );

    return albums.map((album) => ({
      ...album,
      session_count: counts.get(album.id) ?? 0,
    }));
  }
}
