
// ===================================================
// ファイル名: ScheduleTag.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: スケジュールタグモデル — CRUD、アップサート
// ===================================================

import { run, get, all } from "../../shared/db/dbHelpers.js";

const ScheduleTag = {
    async listAll() {
        return all(`SELECT * FROM schedule_tags ORDER BY created_at ASC`);
    },

    /** Upsert — same id updates the color instead of erroring. */
    async upsert(id, color) {
        const existing = await get(`SELECT id FROM schedule_tags WHERE id = ?`, [id]);
        if (existing) {
            await run(
                `UPDATE schedule_tags SET color = ?, updated_at = datetime('now') WHERE id = ?`,
                [color, id],
            );
        } else {
            await run(`INSERT INTO schedule_tags (id, color) VALUES (?, ?)`, [id, color]);
        }
        return get(`SELECT * FROM schedule_tags WHERE id = ?`, [id]);
    },

    async remove(id) {
        const { changes } = await run(`DELETE FROM schedule_tags WHERE id = ?`, [id]);
        return changes > 0;
    },
};

export default ScheduleTag;
