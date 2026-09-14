
// ===================================================
// ファイル名: Schedule.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: スケジュールモデル — CRUD、ソフト削除、更新履歴
// ===================================================

import { run, get, all } from "../../shared/db/dbHelpers.js";

function parseRow(row) {
    if (!row) return null;
    return {
        id: row.id,
        title: row.title,
        subtitle: row.subtitle || null,
        description: row.description,
        eventDate: row.event_date,
        eventTime: row.event_time,
        tags: JSON.parse(row.tags || "[]"),
        authorId: row.author_id,
        author: row.author_name,
        authorRole: row.author_role,
        isEdited: !!row.is_edited,
        isDeleted: !!row.is_deleted,
        deletedAt: row.deleted_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

const Schedule = {
    async listActive() {
        const rows = await all(
            `SELECT * FROM schedule_items
       WHERE is_deleted = 0
       ORDER BY event_date ASC, event_time ASC`,
        );
        return rows.map(parseRow);
    },

    async listToday(todayIso) {
        const rows = await all(
            `SELECT * FROM schedule_items
       WHERE is_deleted = 0 AND event_date = ?
       ORDER BY event_time ASC`,
            [todayIso],
        );
        return rows.map(parseRow);
    },

    async listUpcoming(todayIso, limit = null) {
        const sql = `SELECT * FROM schedule_items
       WHERE is_deleted = 0 AND event_date >= ?
       ORDER BY event_date ASC, event_time ASC
       ${limit ? "LIMIT ?" : ""}`;
        const params = limit ? [todayIso, limit] : [todayIso];
        const rows = await all(sql, params);
        return rows.map(parseRow);
    },

    /** Range query for Relative view's rolling window — avoids fetching the entire table client-side. */
    async listInRange(startIso, endIso) {
        const rows = await all(
            `SELECT * FROM schedule_items
       WHERE is_deleted = 0 AND event_date >= ? AND event_date <= ?
       ORDER BY event_date ASC, event_time ASC`,
            [startIso, endIso],
        );
        return rows.map(parseRow);
    },

    async listUpdatedSince(sinceIso) {
        const rows = await all(
            `SELECT * FROM schedule_items WHERE updated_at > ? ORDER BY updated_at ASC`,
            [sinceIso],
        );
        return rows.map(parseRow);
    },

    async findById(id) {
        const row = await get(`SELECT * FROM schedule_items WHERE id = ?`, [id]);
        return parseRow(row);
    },

    async create({ title, subtitle, description, eventDate, eventTime, tags, author }) {
        const { lastID } = await run(
            `INSERT INTO schedule_items
         (title, subtitle, description, event_date, event_time, tags, author_id, author_name, author_role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                title,
                subtitle || null,
                description || null,
                eventDate,
                eventTime,
                JSON.stringify(tags || []),
                author.id,
                author.name,
                author.role,
            ],
        );

        return Schedule.findById(lastID);
    },

    async update(id, changes) {
        const before = await Schedule.findById(id);
        if (!before || before.isDeleted) return null;

        const next = {
            title: changes.title ?? before.title,
            subtitle: changes.subtitle ?? before.subtitle,
            description: changes.description ?? before.description,
            eventDate: changes.eventDate ?? before.eventDate,
            eventTime: changes.eventTime ?? before.eventTime,
            tags: changes.tags ?? before.tags,
        };

        await run(
            `UPDATE schedule_items
       SET title = ?, subtitle = ?, description = ?, event_date = ?, event_time = ?, tags = ?,
           is_edited = 1, updated_at = datetime('now')
       WHERE id = ?`,
            [
                next.title,
                next.subtitle,
                next.description,
                next.eventDate,
                next.eventTime,
                JSON.stringify(next.tags),
                id,
            ],
        );

        return Schedule.findById(id);
    },

    async softDelete(id) {
        const before = await Schedule.findById(id);
        if (!before || before.isDeleted) return null;

        await run(
            `UPDATE schedule_items
       SET is_deleted = 1, deleted_at = datetime('now'), updated_at = datetime('now')
       WHERE id = ?`,
            [id],
        );

        return Schedule.findById(id);
    },
};

export default Schedule;
