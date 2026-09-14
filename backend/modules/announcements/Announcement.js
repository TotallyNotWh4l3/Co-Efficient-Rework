// ===================================================
// ファイル名: Announcement.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: アナウンスメントモデル — CRUD、アーカイブ、ソフト削除、ログ記録
// ===================================================


import { run, get, all } from "../../shared/db/dbHelpers.js";
import AnnouncementLog from "./AnnouncementLog.js";

const ARCHIVE_AFTER_DAYS = 30; // tweak as needed, or move to shared/constants

function toIsoUtc(sqliteTimestamp) {
    if (!sqliteTimestamp) return null;
    // SQLite CURRENT_TIMESTAMP: "YYYY-MM-DD HH:MM:SS" (UTC, no marker)
    return sqliteTimestamp.replace(" ", "T") + "Z";
}

function parseRow(row) {
    if (!row) return null;
    return {
        id: row.id,
        title: row.title,
        titleJa: row.title_ja,
        content: row.content,
        contentJa: row.content_ja,
        categories: JSON.parse(row.categories || '["general"]'),
        isPinned: !!row.is_pinned,
        authorId: row.author_id,
        author: row.author_name,
        authorRole: row.author_role,
        isEdited: !!row.is_edited,
        isDeleted: !!row.is_deleted,
        deletedAt: toIsoUtc(row.deleted_at),
        isArchived: !!row.is_archived,
        archivedAt: toIsoUtc(row.archived_at),
        createdAt: toIsoUtc(row.created_at),
        updatedAt: toIsoUtc(row.updated_at),
    };
}

const Announcement = {
    /** Last N active (non-deleted, non-archived) announcements, pinned first, then newest. */
    async listRecent(limit = 5) {
        const rows = await all(
            `SELECT * FROM announcements
       WHERE is_deleted = 0 AND is_archived = 0
       ORDER BY is_pinned DESC, created_at DESC
       LIMIT ?`,
            [limit],
        );
        return rows.map(parseRow);
    },

    /** All active announcements (for full dashboard list / filtering client-side). */
    async listActive() {
        const rows = await all(
            `SELECT * FROM announcements
       WHERE is_deleted = 0 AND is_archived = 0
       ORDER BY is_pinned DESC, created_at DESC`,
        );
        return rows.map(parseRow);
    },

    /** Archived announcements (separate archive view). */
    async listArchived() {
        const rows = await all(
            `SELECT * FROM announcements
       WHERE is_archived = 1 AND is_deleted = 0
       ORDER BY archived_at DESC`,
        );
        return rows.map(parseRow);
    },

    /** Anything updated after `sinceIso` — used by sub-devices to sync deltas. */
    async listUpdatedSince(sinceIso) {
        const rows = await all(
            `SELECT * FROM announcements WHERE updated_at > ? ORDER BY updated_at ASC`,
            [sinceIso],
        );
        return rows.map(parseRow);
    },

    async findById(id) {
        const row = await get(`SELECT * FROM announcements WHERE id = ?`, [id]);
        return parseRow(row);
    },

    async create({ title, titleJa, content, contentJa, categories, isPinned, author }) {
        const cats = categories && categories.length ? categories : ["general"];
        const pinned = cats.includes("urgent") ? 1 : isPinned ? 1 : 0;

        const { lastID } = await run(
            `INSERT INTO announcements
         (title, title_ja, content, content_ja, categories, is_pinned, author_id, author_name, author_role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                title,
                titleJa || title,
                content,
                contentJa || content,
                JSON.stringify(cats),
                pinned,
                author.id,
                author.name,
                author.role,
            ],
        );

        const created = await Announcement.findById(lastID);
        await AnnouncementLog.record({
            announcementId: created.id,
            action: "create",
            actor: author,
            before: null,
            after: created,
        });
        return created;
    },

    /** Only the author (own posts) or an admin may call this — enforced in controller. */
    async update(id, changes, actor) {
        const before = await Announcement.findById(id);
        if (!before || before.isDeleted) return null;

        const next = {
            title: changes.title ?? before.title,
            titleJa: changes.titleJa ?? before.titleJa,
            content: changes.content ?? before.content,
            contentJa: changes.contentJa ?? before.contentJa,
            categories: changes.categories ?? before.categories,
            isPinned: changes.categories?.includes("urgent")
                ? true
                : (changes.isPinned ?? before.isPinned),
        };

        await run(
            `UPDATE announcements
       SET title = ?, title_ja = ?, content = ?, content_ja = ?, categories = ?,
           is_pinned = ?, is_edited = 1, updated_at = datetime('now')
       WHERE id = ?`,
            [
                next.title,
                next.titleJa,
                next.content,
                next.contentJa,
                JSON.stringify(next.categories),
                next.isPinned ? 1 : 0,
                id,
            ],
        );

        const after = await Announcement.findById(id);
        await AnnouncementLog.record({ announcementId: id, action: "edit", actor, before, after });
        return after;
    },

    /** Soft delete — row stays for audit/log/sync purposes, hidden from normal views. */
    async softDelete(id, actor) {
        const before = await Announcement.findById(id);
        if (!before || before.isDeleted) return null;

        await run(
            `UPDATE announcements
       SET is_deleted = 1, deleted_at = datetime('now'), updated_at = datetime('now')
       WHERE id = ?`,
            [id],
        );

        const after = await Announcement.findById(id);
        await AnnouncementLog.record({
            announcementId: id,
            action: "delete",
            actor,
            before,
            after,
        });
        return after;
    },

    async archive(id, actor = null) {
        const before = await Announcement.findById(id);
        if (!before || before.isArchived) return null;

        await run(
            `UPDATE announcements
       SET is_archived = 1, archived_at = datetime('now'), updated_at = datetime('now')
       WHERE id = ?`,
            [id],
        );

        const after = await Announcement.findById(id);
        await AnnouncementLog.record({
            announcementId: id,
            action: "archive",
            actor: actor || { id: 0, name: "System (auto-archive)", role: "system" },
            before,
            after,
        });
        return after;
    },

    async restore(id, actor) {
        const before = await Announcement.findById(id);
        if (!before || !before.isArchived) return null;

        await run(
            `UPDATE announcements
       SET is_archived = 0, archived_at = NULL, updated_at = datetime('now')
       WHERE id = ?`,
            [id],
        );

        const after = await Announcement.findById(id);
        await AnnouncementLog.record({
            announcementId: id,
            action: "restore",
            actor,
            before,
            after,
        });
        return after;
    },

    /** Auto-archive everything older than ARCHIVE_AFTER_DAYS. Called by a scheduled job. */
    async autoArchiveStale() {
        const rows = await all(
            `SELECT id FROM announcements
       WHERE is_deleted = 0 AND is_archived = 0
         AND created_at <= datetime('now', ?)`,
            [`-${ARCHIVE_AFTER_DAYS} days`],
        );

        const archived = [];
        for (const row of rows) {
            const result = await Announcement.archive(row.id);
            if (result) archived.push(result);
        }
        return archived;
    },
};

export default Announcement;
