
// ===================================================
// ファイル名: UserSettings.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ユーザー設定モデル — CRUD、アップサート
// ===================================================

import db from "../../shared/db/database.js";

async function findByUserId(userId) {
    const result = await db.execute({
        sql: `
            SELECT *
            FROM user_settings
            WHERE user_id = ?
        `,
        args: [userId],
    });

    const row = result.rows[0];
    if (!row) return null;

    return {
        ...row,
        settings: JSON.parse(row.settings_json),
    };
}

async function create(userId, settings) {
    const result = await db.execute({
        sql: `
            INSERT INTO user_settings (
                user_id,
                settings_json
            )
            VALUES (?, ?)
        `,
        args: [userId, JSON.stringify(settings)],
    });

    return Number(result.lastInsertRowid);
}

async function updateByUserId(userId, settings) {
    const result = await db.execute({
        sql: `
            UPDATE user_settings
            SET
                settings_json = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE
                user_id = ?
        `,
        args: [JSON.stringify(settings), userId],
    });

    return result.rowsAffected;
}

async function deleteByUserId(userId) {
    const result = await db.execute({
        sql: `
            DELETE FROM user_settings
            WHERE user_id = ?
        `,
        args: [userId],
    });

    return result.rowsAffected;
}

async function upsert(userId, settings) {
    const existing = await findByUserId(userId);

    if (existing) {
        return updateByUserId(userId, settings);
    }

    return create(userId, settings);
}

export default {
    findByUserId,

    create,
    updateByUserId,
    deleteByUserId,

    upsert,
};
