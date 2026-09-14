// ===================================================
// ファイル名: scheduleController.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: スケジュールの管理を行うAPIコントローラー。スケジュールイベントの作成、更新、削除、および取得などの機能を提供します。
// ===================================================


// backend/controllers/scheduleController.js
import Schedule from "./Schedule.js";
import ScheduleTag from "./ScheduleTag.js";
import { broadcast } from "../../sse/SSEController.js";

const ROLE_RANK = { user: 0, manager: 1, admin: 2 };
const canModify = (actor, event) => {
    if (!actor) return false;
    const actorRank = ROLE_RANK[actor.role?.toLowerCase()] ?? 0;
    const eventRank = ROLE_RANK[event.authorRole?.toLowerCase()] ?? 0;
    return actorRank > eventRank || event.authorId === actor.id;
};
const isAdmin = (user) => user.role?.toLowerCase() === "admin";

function todayIso() {
    return new Date().toISOString().slice(0, 10);
}

const scheduleController = {
    async getAll(req, res) {
        try {
            res.json(await Schedule.listActive());
        } catch (err) {
            res.status(500).json({ message: "Failed to load schedule.", error: err.message });
        }
    },

    async getToday(req, res) {
        try {
            res.json(await Schedule.listToday(todayIso()));
        } catch (err) {
            res.status(500).json({
                message: "Failed to load today's schedule.",
                error: err.message,
            });
        }
    },

    async getUpcoming(req, res) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : null;
            res.json(await Schedule.listUpcoming(todayIso(), limit));
        } catch (err) {
            res.status(500).json({
                message: "Failed to load upcoming events.",
                error: err.message,
            });
        }
    },

    // GET /api/schedule/range?start=YYYY-MM-DD&end=YYYY-MM-DD -> Relative view's rolling window
    async getRange(req, res) {
        const { start, end } = req.query;
        if (!start || !end) {
            return res.status(400).json({ message: "start and end query params are required." });
        }
        try {
            res.json(await Schedule.listInRange(start, end));
        } catch (err) {
            res.status(500).json({ message: "Failed to load schedule range.", error: err.message });
        }
    },

    async getSince(req, res) {
        try {
            const since = req.query.since || "1970-01-01T00:00:00.000Z";
            res.json(await Schedule.listUpdatedSince(since));
        } catch (err) {
            res.status(500).json({ message: "Failed to sync schedule.", error: err.message });
        }
    },

    async create(req, res) {
        const { title, subtitle, description, eventDate, eventTime, tags } = req.body;
        if (!title?.trim() || !eventDate || !eventTime) {
            return res
                .status(400)
                .json({ message: "Title, event date, and event time are required." });
        }

        try {
            const created = await Schedule.create({
                title,
                subtitle,
                description,
                eventDate,
                eventTime,
                tags,
                author: { id: req.user.id, name: req.user.username, role: req.user.role },
            });

            broadcast("schedule:created", created);
            res.status(201).json(created);
        } catch (err) {
            res.status(500).json({ message: "Failed to create event.", error: err.message });
        }
    },

    async update(req, res) {
        try {
            const existing = await Schedule.findById(req.params.id);
            if (!existing || existing.isDeleted) {
                return res.status(404).json({ message: "Event not found." });
            }
            if (!canModify(req.user, existing)) {
                return res
                    .status(403)
                    .json({ message: "You don't have permission to edit this event." });
            }

            const updated = await Schedule.update(req.params.id, req.body);

            broadcast("schedule:updated", updated);
            res.json(updated);
        } catch (err) {
            res.status(500).json({ message: "Failed to update event.", error: err.message });
        }
    },

    async remove(req, res) {
        try {
            const existing = await Schedule.findById(req.params.id);
            if (!existing || existing.isDeleted) {
                return res.status(404).json({ message: "Event not found." });
            }
            if (!canModify(req.user, existing)) {
                return res
                    .status(403)
                    .json({ message: "You don't have permission to delete this event." });
            }

            const deleted = await Schedule.softDelete(req.params.id);

            broadcast("schedule:deleted", deleted);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ message: "Failed to delete event.", error: err.message });
        }
    },

    // ---- Tag management ----

    // GET /api/schedule/tags
    async getTags(req, res) {
        try {
            res.json(await ScheduleTag.listAll());
        } catch (err) {
            res.status(500).json({ message: "Failed to load tags.", error: err.message });
        }
    },

    // POST /api/schedule/tags -> admin only, { id, color }
    async upsertTag(req, res) {
        if (!isAdmin(req.user)) {
            return res.status(403).json({ message: "Only admins can manage tag presets." });
        }
        const { id, color } = req.body;
        if (!id?.trim() || !color?.trim()) {
            return res.status(400).json({ message: "Tag id and color are required." });
        }
        try {
            const tag = await ScheduleTag.upsert(id.trim(), color.trim());
            broadcast("schedule:tag-updated", tag);
            res.status(201).json(tag);
        } catch (err) {
            res.status(500).json({ message: "Failed to save tag.", error: err.message });
        }
    },

    // DELETE /api/schedule/tags/:id -> admin only
    async removeTag(req, res) {
        if (!isAdmin(req.user)) {
            return res.status(403).json({ message: "Only admins can manage tag presets." });
        }
        try {
            const removed = await ScheduleTag.remove(req.params.id);
            if (!removed) return res.status(404).json({ message: "Tag not found." });

            broadcast("schedule:tag-removed", { id: req.params.id });
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ message: "Failed to delete tag.", error: err.message });
        }
    },
};

export default scheduleController;
