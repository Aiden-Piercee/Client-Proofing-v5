"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
async;
createAnonymousSession(albumId, number);
{
    const token = crypto.randomBytes(16).toString('hex');
    await this.db.query('INSERT INTO client_sessions (album_id, token, created_at) VALUES (?, ?, NOW())', [albumId, token]);
    return {
        album_id: albumId,
        token,
        magic_url: `${process.env.FRONTEND_URL}/proofing/${albumId}/client/${token}`
    };
}
//# sourceMappingURL=sessions.service.addition.js.map