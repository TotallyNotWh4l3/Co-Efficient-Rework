
// ===================================================
// ファイル名: Theme.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: テーマモデル — CRUD、テーマ管理
// ===================================================

import db from "../../shared/db/database.js";

function mapRow(row) {
    if (!row) return null;

    return {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        builtIn: Boolean(row.built_in),
        basedOn: row.based_on,
        appearance: JSON.parse(row.appearance),
        createdAt: row.created_at,
    };
}

async function findAll() {
    const result = await db.execute({
        sql: `
            SELECT *
            FROM themes
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
            FROM themes
            WHERE id = ?
        `,
        args: [id],
    });

    return mapRow(result.rows[0]);
}

async function create(theme) {
    const { id, userId, name, builtIn = false, basedOn = null, appearance } = theme;

    await db.execute({
        sql: `
            INSERT INTO themes (
                id,
                user_id,
                name,
                built_in,
                based_on,
                appearance
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `,
        args: [id, userId, name, builtIn ? 1 : 0, basedOn, JSON.stringify(appearance)],
    });

    return id;
}

// allowBuiltIn: only admins should ever pass true (enforced in the
// controller) — lets an admin edit a built-in theme's appearance/name,
// while everyone else remains blocked at the SQL level as before.
async function update(id, updates, allowBuiltIn = false) {
    const fields = [];
    const values = [];

    if (updates.name !== undefined) {
        fields.push("name = ?");
        values.push(updates.name);
    }

    if (updates.appearance !== undefined) {
        fields.push("appearance = ?");
        values.push(JSON.stringify(updates.appearance));
    }

    if (fields.length === 0) {
        return 0;
    }

    values.push(id);

    const builtInClause = allowBuiltIn ? "" : "AND built_in = 0";

    const result = await db.execute({
        sql: `
            UPDATE themes
            SET ${fields.join(", ")}
            WHERE id = ? ${builtInClause}
        `,
        args: values,
    });

    return result.rowsAffected;
}

async function deleteById(id) {
    const result = await db.execute({
        sql: `
            DELETE FROM themes
            WHERE id = ? AND built_in = 0
        `,
        args: [id],
    });

    return result.rowsAffected;
}

export default {
    findAll,
    findById,
    create,
    update,
    deleteById,
};
