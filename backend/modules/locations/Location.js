// ===================================================
// ファイル名: Location.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ロケーションモデル — CRUD、位置情報管理
// ===================================================

import db from "../../shared/db/database.js";

function mapRow(row) {
    if (!row) return null;

    return {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        latitude: row.latitude,
        longitude: row.longitude,
        timezone: row.timezone,
        builtIn: Boolean(row.built_in),
        createdAt: row.created_at,
    };
}

async function findAllByUserId(userId) {
    const result = await db.execute({
        sql: `
            SELECT *
            FROM locations
            WHERE user_id = ?
            ORDER BY built_in DESC, created_at ASC
        `,
        args: [userId],
    });

    return result.rows.map(mapRow);
}

/**
 * Locations are shared/global (one list everyone sees), not per-user —
 * user_id on the row just tracks who created it. This lists all of them.
 */
async function findAll() {
    const result = await db.execute({
        sql: `
            SELECT *
            FROM locations
            ORDER BY built_in DESC, created_at ASC
        `,
        args: [],
    });

    return result.rows.map(mapRow);
}

async function findById(id) {
    const result = await db.execute({
        sql: `
            SELECT *
            FROM locations
            WHERE id = ?
        `,
        args: [id],
    });

    return mapRow(result.rows[0]);
}

/**
 * userId here means "created by" (an audit trail of who added it), not an
 * owner — the row is visible/usable by everyone once created. Only the
 * controller layer restricts *who* is allowed to call this (admin/manager).
 */
async function create(location) {
    const {
        id,
        userId,
        name,
        latitude,
        longitude,
        timezone = "Asia/Tokyo",
        builtIn = false,
    } = location;

    await db.execute({
        sql: `
            INSERT INTO locations (
                id,
                user_id,
                name,
                latitude,
                longitude,
                timezone,
                built_in
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        args: [id, userId, name, latitude, longitude, timezone, builtIn ? 1 : 0],
    });

    return id;
}

async function update(id, updates) {
    const fields = [];
    const values = [];

    if (updates.name !== undefined) {
        fields.push("name = ?");
        values.push(updates.name);
    }

    if (updates.latitude !== undefined) {
        fields.push("latitude = ?");
        values.push(updates.latitude);
    }

    if (updates.longitude !== undefined) {
        fields.push("longitude = ?");
        values.push(updates.longitude);
    }

    if (updates.timezone !== undefined) {
        fields.push("timezone = ?");
        values.push(updates.timezone);
    }

    if (fields.length === 0) {
        return 0;
    }

    values.push(id);

    const result = await db.execute({
        sql: `
            UPDATE locations
            SET ${fields.join(", ")}
            WHERE id = ?
        `,
        args: values,
    });

    return result.rowsAffected;
}

async function deleteById(id) {
    const result = await db.execute({
        sql: `
            DELETE FROM locations
            WHERE id = ? AND built_in = 0
        `,
        args: [id],
    });

    return result.rowsAffected;
}

export default {
    findAllByUserId,
    findAll,
    findById,

    create,
    update,
    deleteById,
};
