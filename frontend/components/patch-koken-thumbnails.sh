#!/bin/bash

FILE="/home/Kokenstaging/web/clients.chasing.media/client-proofing/backend/src/koken/koken.service.ts"

echo "🔍 Checking for koken.service.ts..."
if [ ! -f "$FILE" ]; then
  echo "❌ ERROR: File not found: $FILE"
  exit 1
fi

echo "📦 Backing up original → koken.service.ts.bak"
cp "$FILE" "$FILE.bak"

echo "📝 Writing updated koken.service.ts (thumbnail-enabled backend)..."

cat > "$FILE" << 'EOT'
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'mysql2/promise';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { KOKEN_DB } from '../config/database.config';
import fetch from 'node-fetch';

const KOKEN_BASE_URL = "http://clients.chasing.media";

export interface KokenAlbum extends RowDataPacket {
  id: number;
  title: string;
  slug: string;
  visibility: string;
  created_on: number;
}

export interface KokenImage extends RowDataPacket {
  id: number;
  title?: string;
  caption?: string;
  filename?: string;
  internal_id?: string;
  favorite?: number;
  visibility?: string;
  storage_path?: string;

  // Added fields for thumbnails
  thumb?: string;
  thumb2x?: string;
  large?: string;
  full?: string;
}

@Injectable()
export class KokenService {
  constructor(@Inject(KOKEN_DB) private readonly kokenDb: Pool) {}

  // 🔥 NEW — fetch from Koken API for thumbnail presets
  private async fetchKokenApiImage(id: number): Promise<any> {
    const url = `${KOKEN_BASE_URL}/api.php?/content/${id}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(\`Koken API returned \${res.status} for image \${id}\`);
    }
    return res.json();
  }

  async listAlbums(): Promise<KokenAlbum[]> {
    const [rows] = await this.kokenDb.query<KokenAlbum[]>(
      \`SELECT id, title, slug, visibility, created_on
       FROM koken_albums
       ORDER BY created_on DESC\`
    );
    return rows;
  }

  async getAlbumById(id: number): Promise<KokenAlbum | null> {
    const [rows] = await this.kokenDb.query<KokenAlbum[]>(
      \`SELECT id, title, slug, visibility, created_on
       FROM koken_albums
       WHERE id = ?
       LIMIT 1\`,
      [id]
    );
    return rows.length ? rows[0] : null;
  }

  async listImagesForAlbum(albumId: number): Promise<KokenImage[]> {
    const [rows] = await this.kokenDb.query<KokenImage[]>(
      \`SELECT
          c.id,
          c.title,
          c.caption,
          c.filename,
          c.internal_id,
          c.favorite,
          c.visibility,
          CONCAT(
            '/storage/originals/',
            SUBSTRING(c.internal_id, 1, 2), '/',
            SUBSTRING(c.internal_id, 3, 2), '/',
            c.filename
          ) AS storage_path
       FROM koken_join_albums_content jac
       INNER JOIN koken_content c ON c.id = jac.content_id
       WHERE jac.album_id = ?
       ORDER BY jac.order ASC\`,
      [albumId]
    );

    const mapped = await Promise.all(
      rows.map(async (img) => {
        try {
          const api = await this.fetchKokenApiImage(img.id);

          img.thumb = api.presets?.medium?.url;
          img.thumb2x = api.presets?.medium?.hidpi_url;
          img.large = api.presets?.large?.url;
          img.full = api.presets?.huge?.url || api.url;

        } catch (e) {
          console.error(\`Thumbnail fetch failed for \${img.id}:\`, e);
        }
        return img;
      })
    );

    return mapped;
  }

  async writeFavoriteToKoken(imageId: number): Promise<void> {
    const [result] = await this.kokenDb.query<ResultSetHeader>(
      \`UPDATE koken_content
       SET favorite = 1, favorited_on = UNIX_TIMESTAMP()
       WHERE id = ?\`,
      [imageId]
    );
    if (result.affectedRows === 0) {
      throw new NotFoundException(\`Image \${imageId} not found in Koken.\`);
    }
  }

  async removeFavoriteFromKoken(imageId: number): Promise<void> {
    const [result] = await this.kokenDb.query<ResultSetHeader>(
      \`UPDATE koken_content
       SET favorite = 0, favorited_on = NULL
       WHERE id = ?\`,
      [imageId]
    );
    if (result.affectedRows === 0) {
      throw new NotFoundException(\`Image \${imageId} not found in Koken.\`);
    }
  }

  async getImageById(imageId: number): Promise<KokenImage | null> {
    const [rows] = await this.kokenDb.query<KokenImage[]>(
      \`SELECT
          id, title, caption, filename, favorite, visibility,
          CONCAT(
            '/storage/originals/',
            SUBSTRING(internal_id, 1, 2), '/',
            SUBSTRING(internal_id, 3, 2), '/',
            filename
          ) AS storage_path
       FROM koken_content
       WHERE id = ?
       LIMIT 1\`,
      [imageId]
    );

    if (!rows.length) return null;

    const img = rows[0];

    try {
      const api = await this.fetchKokenApiImage(imageId);

      img.thumb = api.presets?.medium?.url;
      img.thumb2x = api.presets?.medium?.hidpi_url;
      img.large = api.presets?.large?.url;
      img.full = api.presets?.huge?.url || api.url;

    } catch (e) {
      console.error(\`Thumbnail fetch failed for \${imageId}:\`, e);
    }

    return img;
  }
}
EOT

echo "✅ Backend Koken thumbnail patch applied!"
echo "Backup saved as: $FILE.bak"
