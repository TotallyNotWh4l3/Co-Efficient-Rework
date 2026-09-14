// ===================================================
// ファイル名: announcementController.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: お知らせの管理を行うAPIコントローラー。お知らせの作成、更新、削除、およびお知らせとそのログの取得などの機能を提供します。
// また、ロール（管理者、マネージャーなど）に基づいて各種アクションに対するユーザーの権限を処理し、
// お知らせを既読にマークしたり、未読数を取得したりするためのエンドポイントも提供します。
// ===================================================

import Announcement from "./Announcement.js";
import AnnouncementLog from "./AnnouncementLog.js";
import AnnouncementRead from "./AnnouncementRead.js";
import { broadcast } from "../../sse/SSEController.js";

const isAdmin = (user) => user.role?.toLowerCase() === "admin";
const isManagerOrAbove = (user) => ["manager", "admin"].includes(user.role?.toLowerCase());
const canModify = (user, announcement) => isAdmin(user) || announcement.authorId === user.id;

const announcementController = {
    // GET /api/announcements/recent -> last 5, for the dashboard card
    async getRecent(req, res) {
        try {
            const items = await Announcement.listRecent(5);
            res.json(await AnnouncementRead.attachReadState(items, req.user?.id));
        } catch (err) {
            res.status(500).json({
                message: "Failed to load recent announcements.",
                error: err.message,
            });
        }
    },

    // GET /api/announcements -> full active list (search/filter/tabs happen client-side)
    async getAll(req, res) {
        try {
            const items = await Announcement.listActive();
            res.json(await AnnouncementRead.attachReadState(items, req.user?.id));
        } catch (err) {
            res.status(500).json({ message: "Failed to load announcements.", error: err.message });
        }
    },

    // GET /api/announcements/archive -> archive browser view
    async getArchived(req, res) {
        try {
            res.json(await Announcement.listArchived());
        } catch (err) {
            res.status(500).json({ message: "Failed to load archive.", error: err.message });
        }
    },

    // GET /api/announcements/sync?since=<ISO timestamp> -> delta fetch for sub-devices
    async getSince(req, res) {
        try {
            const since = req.query.since || "1970-01-01T00:00:00.000Z";
            res.json(await Announcement.listUpdatedSince(since));
        } catch (err) {
            res.status(500).json({ message: "Failed to sync announcements.", error: err.message });
        }
    },

    // GET /api/announcements/:id/logs -> admin-only audit trail
    async getLogs(req, res) {
        if (!isAdmin(req.user)) {
            return res.status(403).json({ message: "Only admins can view announcement logs." });
        }
        try {
            res.json(await AnnouncementLog.listForAnnouncement(req.params.id));
        } catch (err) {
            res.status(500).json({ message: "Failed to load logs.", error: err.message });
        }
    },

    // POST /api/announcements/:id/read -> mark one announcement as read by the current user
    async markRead(req, res) {
        try {
            await AnnouncementRead.markRead(req.params.id, req.user.id);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({
                message: "Failed to mark announcement as read.",
                error: err.message,
            });
        }
    },

    // GET /api/announcements/unread-count -> badge count for the current user
    async getUnreadCount(req, res) {
        try {
            const count = await AnnouncementRead.unreadCount(req.user.id);
            res.json({ count });
        } catch (err) {
            res.status(500).json({ message: "Failed to load unread count.", error: err.message });
        }
    },

    // POST /api/announcements -> any authenticated user may post
    async create(req, res) {
        const { title, titleJa, content, contentJa, categories, isPinned } = req.body;
        if (!title?.trim() || !content?.trim()) {
            return res.status(400).json({ message: "Title and content are required." });
        }

        try {
            const created = await Announcement.create({
                title,
                titleJa,
                content,
                contentJa,
                categories,
                isPinned,
                author: { id: req.user.id, name: req.user.username, role: req.user.role },
            });

            broadcast("announcements:created", created);
            res.status(201).json(created);
        } catch (err) {
            res.status(500).json({ message: "Failed to create announcement.", error: err.message });
        }
    },

    // PATCH /api/announcements/:id -> owner or admin only
    async update(req, res) {
        try {
            const existing = await Announcement.findById(req.params.id);
            if (!existing || existing.isDeleted) {
                return res.status(404).json({ message: "Announcement not found." });
            }
            if (!canModify(req.user, existing)) {
                return res
                    .status(403)
                    .json({ message: "You can only edit your own announcements." });
            }

            const updated = await Announcement.update(req.params.id, req.body, {
                id: req.user.id,
                name: req.user.username,
                role: req.user.role,
            });

            broadcast("announcements:updated", updated);
            res.json(updated);
        } catch (err) {
            res.status(500).json({ message: "Failed to update announcement.", error: err.message });
        }
    },

    // DELETE /api/announcements/:id -> owner or admin only (soft delete)
    async remove(req, res) {
        try {
            const existing = await Announcement.findById(req.params.id);
            if (!existing || existing.isDeleted) {
                return res.status(404).json({ message: "Announcement not found." });
            }
            if (!canModify(req.user, existing)) {
                return res
                    .status(403)
                    .json({ message: "You can only delete your own announcements." });
            }

            const deleted = await Announcement.softDelete(req.params.id, {
                id: req.user.id,
                name: req.user.username,
                role: req.user.role,
            });

            broadcast("announcements:deleted", deleted);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ message: "Failed to delete announcement.", error: err.message });
        }
    },

    // POST /api/announcements/:id/restore -> restore from archive, manager or above
    async restore(req, res) {
        if (!isManagerOrAbove(req.user)) {
            return res
                .status(403)
                .json({ message: "Only managers or admins can restore announcements." });
        }
        try {
            const restored = await Announcement.restore(req.params.id, {
                id: req.user.id,
                name: req.user.username,
                role: req.user.role,
            });
            if (!restored)
                return res.status(404).json({ message: "Archived announcement not found." });

            broadcast("announcements:restored", restored);
            res.json(restored);
        } catch (err) {
            res.status(500).json({
                message: "Failed to restore announcement.",
                error: err.message,
            });
        }
    },

    // POST /api/announcements/:id/archive -> manual archive, manager or above
    async archiveNow(req, res) {
        if (!isManagerOrAbove(req.user)) {
            return res
                .status(403)
                .json({ message: "Only managers or admins can archive announcements." });
        }
        try {
            const archived = await Announcement.archive(req.params.id, {
                id: req.user.id,
                name: req.user.username,
                role: req.user.role,
            });
            if (!archived) return res.status(404).json({ message: "Announcement not found." });

            broadcast("announcements:archived", archived);
            res.json(archived);
        } catch (err) {
            res.status(500).json({
                message: "Failed to archive announcement.",
                error: err.message,
            });
        }
    },
};

export default announcementController;
