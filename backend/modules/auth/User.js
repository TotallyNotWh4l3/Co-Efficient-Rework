
// ===================================================
// ファイル名: User.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ユーザーモデル — CRUD、認証
// ===================================================

import db from "../../shared/db/database.js";

async function findById(id) {
    const result = await db.execute({
        sql: `SELECT * FROM users WHERE id = ?`,
        args: [id],
    });

    return result.rows[0];
}

async function findByUsername(username) {
    const result = await db.execute({
        sql: `SELECT * FROM users WHERE username = ?`,
        args: [username],
    });

    return result.rows[0];
}

async function findAll() {
    const result = await db.execute({
        sql: `SELECT id, username, role, created_at FROM users ORDER BY username ASC`,
        args: [],
    });

    return result.rows;
}

async function create(username, passwordHash, role = "user") {
    const result = await db.execute({
        sql: `INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)`,
        args: [username, passwordHash, role],
    });

    return Number(result.lastInsertRowid);
}

async function updateRole(id, role) {
    const result = await db.execute({
        sql: `UPDATE users SET role = ? WHERE id = ?`,
        args: [role, id],
    });

    return result.rowsAffected;
}

async function updatePassword(id, passwordHash) {
    const result = await db.execute({
        sql: `UPDATE users SET password_hash = ? WHERE id = ?`,
        args: [passwordHash, id],
    });

    return result.rowsAffected;
}

async function deleteById(id) {
    const result = await db.execute({
        sql: `DELETE FROM users WHERE id = ?`,
        args: [id],
    });

    return result.rowsAffected;
}

export default {
    findById,
    findByUsername,
    findAll,
    create,
    updateRole,
    updatePassword,
    deleteById,
};
