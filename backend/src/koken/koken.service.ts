// CLEAN FIXED VERSION: returns ONE cover per album (official Koken cover only)
// Your entire service rewritten minimally to remove duplicates.

import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { Pool } from 'mysql2/promise';
import { KOKEN_DB } from '../config/database.config';
import fetch from 'node-fetch';

const KOKEN_BASE = "http://clients.chasing.media";

export interface KokenImageRow {
  id: number;
  title: string | null;
  caption: string | null;
  filename: string;
  internal_id: string;
  favorite: number;
  visibility: number | string;
  modified_on: number;
  captured_on: number;
  thumb?: string | null;
  thumb2x?: string | null;
  medium?: string | null;
  medium2x?: string | null;
  large?: string | null;
  large2x?: string | null;
  full?: string | null;
  storage_path?: string | null;
}

type AlbumRow = RowDataPacket & {
  id: number;
  title: string | null;
  slug: string;
  visibility: number | string;
  created_on: number;
  cover_id: number | null;
};

type EnrichedAlbum = AlbumRow & { cover_url: string };

@Injectable()
export class KokenService {
  constructor(@Inject(KOKEN_DB) private readonly kokenDb: Pool) {}

  private neutralPlaceholder =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="90" viewBox="0 0 120 90" fill="none"><rect width="120" height="90" rx="8" fill="#f3f4f6"/><path d="M32 60l14-18 12 15 10-12 10 15H32z" fill="#d1d5db"/><circle cx="44" cy="38" r="6" fill="#e5e7eb"/></svg>'
    );

  // --- COVER LOGIC :: USE ONLY cover_id ---
  private async enrichAlbumCovers(albums: AlbumRow[]) {
    if (!albums.length) return [] as EnrichedAlbum[];

    const normalized = albums.map((album) => ({
      ...album,
      cover_id: album.cover_id !== null ? Number(album.cover_id) : null,
    })) as AlbumRow[];

    const coverIds = normalized
      .map((a) => a.cover_id)
      .filter((id): id is number => !!id);

    const coverImages = new Map<number, any>();

    await Promise.all(
      coverIds.map(async (id) => {
        try {
          const img = await this.getImageById(id);
          coverImages.set(id, img);
        } catch {}
      })
    );

    return normalized.map((album) => {
      const cover = album.cover_id ? coverImages.get(album.cover_id) : null;
      const cover_url =
        cover?.large2x ??
        cover?.full ??
        cover?.large ??
        cover?.medium2x ??
        cover?.medium ??
        cover?.thumb ??
        this.neutralPlaceholder;

      return { ...album, cover_url } as EnrichedAlbum;
    });
  }

  // --- ALBUM LIST --- ONLY ONE ENTRY PER ALBUM
  async listAlbums() {
    const [rows] = await this.kokenDb.query<RowDataPacket[]>(
      `SELECT
         a.id,
         a.title,
         a.slug,
         a.visibility,
         a.created_on,
         covers.cover_id
       FROM koken_albums a
       LEFT JOIN koken_join_albums_covers covers ON covers.album_id = a.id
       WHERE a.deleted = 0
       GROUP BY a.id
       ORDER BY a.created_on DESC`
    );

    return this.enrichAlbumCovers(rows as AlbumRow[]);
  }

  // --- SINGLE ALBUM ---
  async getAlbumById(id: number) {
    const [rows] = await this.kokenDb.query<RowDataPacket[]>(
      `SELECT
         a.id,
         a.title,
         a.slug,
         a.visibility,
         a.created_on,
         covers.cover_id
       FROM koken_albums a
       LEFT JOIN koken_join_albums_covers covers ON covers.album_id = a.id
       WHERE a.id = ? AND a.deleted = 0
       LIMIT 1`,
      [id]
    );

    if (!rows.length) throw new NotFoundException(`Album ${id} not found`);

    const enriched = await this.enrichAlbumCovers(rows as AlbumRow[]);
    return enriched[0];
  }

  // --- FETCH KOKEN IMAGE API ---
  private async fetchKokenImage(id: number): Promise<any> {
    const res = await fetch(`${KOKEN_BASE}/api.php?/content/${id}`);
    if (!res.ok) throw new Error(`Koken API returned ${res.status}`);
    return res.json();
  }

  private buildStoragePath(internalId: string, filename: string) {
    return `/storage/originals/${internalId.substring(0, 2)}/${internalId.substring(2, 4)}/${filename}`;
  }

  private enrichPresets(api: any) {
    const p = api?.presets ?? {};
    return {
      tiny: p.tiny?.url ?? null,
      tiny2x: p.tiny?.hidpi_url ?? null,
      small: p.small?.url ?? null,
      small2x: p.small?.hidpi_url ?? null,
      medium: p.medium?.url ?? null,
      medium2x: p.medium?.hidpi_url ?? null,
      large: p.large?.url ?? null,
      large2x: p.large?.hidpi_url ?? null,
      huge: p.huge?.url ?? api.url ?? null,
      huge2x: p.huge?.hidpi_url ?? null,
    };
  }

  // --- IMAGES FOR ALBUM ---
  async listImagesForAlbum(albumId: number) {
    const [rows] = await this.kokenDb.query<RowDataPacket[]>(
      `SELECT
         c.id,
         c.title,
         c.caption,
         c.filename,
         c.internal_id,
         c.favorite,
         c.visibility,
         c.modified_on,
         c.captured_on
       FROM koken_join_albums_content jac
       INNER JOIN koken_content c ON jac.content_id = c.id
       WHERE jac.album_id = ? AND c.deleted = 0
       ORDER BY jac.order ASC`,
      [albumId]
    );

    const typed = rows as KokenImageRow[];

    return Promise.all(
      typed.map(async (img) => {
        try {
          const api = await this.fetchKokenImage(img.id);
          const p = this.enrichPresets(api);
          img.thumb = p.small ?? p.medium ?? null;
          img.thumb2x = p.small2x ?? p.medium2x ?? null;
          img.medium = p.medium;
          img.medium2x = p.medium2x;
          img.large = p.large;
          img.large2x = p.large2x;
          img.full = p.huge;
          img.storage_path = this.buildStoragePath(img.internal_id, img.filename);
        } catch {}
        return img;
      })
    );
  }

  async getImageById(imageId: number) {
    const [rows] = await this.kokenDb.query<RowDataPacket[]>(
      `SELECT
         id,
         title,
         caption,
         filename,
         internal_id,
         favorite,
         visibility,
         modified_on,
         captured_on
       FROM koken_content
       WHERE id = ? AND deleted = 0
       LIMIT 1`,
      [imageId]
    );

    if (!rows.length) throw new NotFoundException(`Image ${imageId} not found`);

    const img = rows[0] as KokenImageRow;

    try {
      const api = await this.fetchKokenImage(imageId);
      const p = this.enrichPresets(api);
      img.thumb = p.small ?? p.medium ?? null;
      img.thumb2x = p.small2x ?? p.medium2x ?? null;
      img.medium = p.medium;
      img.medium2x = p.medium2x;
      img.large = p.large;
      img.large2x = p.large2x;
      img.full = p.huge;
      img.storage_path = this.buildStoragePath(img.internal_id, img.filename);
    } catch {}

    return img;
  }
  // FAVORITES SYNC
  async writeFavoriteToKoken(imageId: number) {
    const [result] = await this.kokenDb.query<ResultSetHeader>(
      `UPDATE koken_content
       SET favorite = 1, favorited_on = UNIX_TIMESTAMP()
       WHERE id = ? AND deleted = 0`,
      [imageId]
    );
    if (result.affectedRows === 0) throw new NotFoundException(`Image ${imageId} not found`);
  }

  async removeFavoriteFromKoken(imageId: number) {
    const [result] = await this.kokenDb.query<ResultSetHeader>(
      `UPDATE koken_content
       SET favorite = 0, favorited_on = NULL
       WHERE id = ? AND deleted = 0`,
      [imageId]
    );
    if (result.affectedRows === 0) throw new NotFoundException(`Image ${imageId} not found`);
  }
}

