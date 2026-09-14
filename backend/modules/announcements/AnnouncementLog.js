
// ===================================================
// ファイル名: AnnouncementLog.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: お知らせログモデル — CRUD、変更履歴管理
// ===================================================

import { run, all } from "../../shared/db/dbHelpers.js";

const AnnouncementLog = {
    async record({ announcementId, action, actor, before, after }) {
        await run(
            `INSERT INTO announcement_logs
         (announcement_id, action, actor_id, actor_name, actor_role, before_json, after_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                announcementId,
                action,
                actor.id,
                actor.name,
                actor.role,
                before ? JSON.stringify(before) : null,
                after ? JSON.stringify(after) : null,
            ],
        );
    },

    /** Full history for one announcement — admin-only view. */
    async listForAnnouncement(announcementId) {
        const rows = await all(
            `SELECT * FROM announcement_logs WHERE announcement_id = ? ORDER BY created_at ASC`,
            [announcementId],
        );

        return rows.map((row) => ({
            id: row.id,
            announcementId: row.announcement_id,
            action: row.action,
            actor: { id: row.actor_id, name: row.actor_name, role: row.actor_role },
            before: row.before_json ? JSON.parse(row.before_json) : null,
            after: row.after_json ? JSON.parse(row.after_json) : null,
            createdAt: row.created_at,
        }));
    },
};

export default AnnouncementLog;
