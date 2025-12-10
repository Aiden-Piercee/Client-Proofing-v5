import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'mysql2/promise';
import { PROOFING_DB } from '../config/database.config';

export type SelectionState = 'favorite' | 'approved' | 'rejected' | null;

@Injectable()
export class SelectionsService {
  constructor(@Inject(PROOFING_DB) private readonly proofingDb: Pool) {}

  // CLEAR selection (undo)
  async clearSelection(clientId: number, imageId: number) {
    await this.proofingDb.query(
      `DELETE FROM client_selections WHERE client_id = ? AND image_id = ?`,
      [clientId, imageId],
    );

    return { clientId, imageId, state: null, print: false };
  }

  // UPSERT selection (state + print)
  async upsertSelection(
    clientId: number,
    imageId: number,
    state: SelectionState,
    print?: boolean,
  ) {
    if (!clientId) {
      throw new Error('Client ID is required for selections');
    }

    // Load current record (if exists)
    const [rows] = await this.proofingDb.query<any[]>(
      `SELECT state, print
       FROM client_selections
       WHERE client_id = ? AND image_id = ?`,
      [clientId, imageId],
    );

    let current = rows[0] || { state: null, print: 0 };

    // RULES:
    // 1) Reject clears print
    if (state === 'rejected') {
      current.print = 0;
    }

    // 2) Update print if provided and state != rejected
    if (print !== undefined) {
      if (state !== 'rejected' && current.state !== 'rejected') {
        current.print = print ? 1 : 0;
      }
    }

    // 3) Update state
    if (state !== undefined) {
      current.state = state;
    }

    // UPSERT using ON DUPLICATE
    await this.proofingDb.query(
      `
      INSERT INTO client_selections (client_id, image_id, state, print, updated_at)
      VALUES (?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        state = VALUES(state),
        print = VALUES(print),
        updated_at = NOW()
    `,
      [clientId, imageId, current.state, current.print],
    );

    return {
      clientId,
      imageId,
      state: current.state,
      print: !!current.print,
    };
  }

  async getSelectionsForClient(clientId: number) {
    const [rows] = await this.proofingDb.query<any[]>(
      `SELECT image_id, state, print
       FROM client_selections
       WHERE client_id = ?`,
      [clientId],
    );

    return rows.map((row) => ({
      imageId: row.image_id,
      state: row.state as SelectionState,
      print: !!row.print,
    }));
  }
}
