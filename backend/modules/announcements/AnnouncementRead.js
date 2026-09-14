
// ===================================================
// ファイル名: AnnouncementRead.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: お知らせ既読モデル — CRUD、既読状態管理
// ===================================================

import { run, all } from "../../shared/db/dbHelpers.js";

const AnnouncementRead = {
    /** Mark one announcement as read by one user. Idempotent (UNIQUE constraint). */
    async markRead(announcementId, userId) {
        await run(
            `INSERT OR IGNORE INTO announcement_reads (announcement_id, user_id) VALUES (?, ?)`,
            [announcementId, userId],
        );
    },

    /** Set of announcement IDs this user has already read, scoped to a given ID list. */
    async getReadIds(userId, announcementIds) {
        if (!announcementIds || announcementIds.length === 0) return new Set();

        const placeholders = announcementIds.map(() => "?").join(", ");
        const rows = await all(
            `SELECT announcement_id FROM announcement_reads
       WHERE user_id = ? AND announcement_id IN (${placeholders})`,
            [userId, ...announcementIds],
        );
        return new Set(rows.map((r) => r.announcement_id));
    },

    /** Convenience: stamp `isRead` onto a list of already-parsed announcement objects. */
    async attachReadState(announcements, userId) {
        if (!userId) return announcements.map((a) => ({ ...a, isRead: false }));

        const readIds = await AnnouncementRead.getReadIds(
            userId,
            announcements.map((a) => a.id),
        );
        return announcements.map((a) => ({ ...a, isRead: readIds.has(a.id) }));
    },

    async unreadCount(userId) {
        const row = await all(
            `SELECT COUNT(*) as count FROM announcements a
       WHERE a.is_deleted = 0 AND a.is_archived = 0
         AND NOT EXISTS (
           SELECT 1 FROM announcement_reads r
           WHERE r.announcement_id = a.id AND r.user_id = ?
         )`,
            [userId],
        );
        return row[0]?.count ?? 0;
    },
};

export default AnnouncementRead;
