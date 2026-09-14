// ===================================================
// ファイル名: themesController.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: テーマの管理を行うAPIコントローラー。テーマの作成、更新、削除、および取得などの機能を提供します。
// ===================================================


// backend/controllers/themesController.js
import crypto from "node:crypto";
import Theme from "./Theme.js";
import { broadcast } from "../../sse/SSEController.js";

const isManagerOrAbove = (user) => ["manager", "admin"].includes(user.role?.toLowerCase());
const isAdmin = (user) => user.role?.toLowerCase() === "admin";

const themesController = {
    async getAll(req, res) {
        try {
            res.json(await Theme.findAll());
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Failed to load themes." });
        }
    },

    async create(req, res) {
        if (!isManagerOrAbove(req.user)) {
            return res.status(403).json({ message: "Only managers or admins can create themes." });
        }

        const { name, basedOn, appearance } = req.body;

        if (!name?.trim() || !appearance) {
            return res.status(400).json({ message: "Name and appearance are required." });
        }

        try {
            const id = req.body.id || crypto.randomUUID();
            await Theme.create({
                id,
                userId: req.user.id,
                name: name.trim(),
                builtIn: false,
                basedOn: basedOn ?? null,
                appearance,
            });

            const created = await Theme.findById(id);
            broadcast("themes:theme-created", created);
            res.status(201).json(created);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Failed to create theme." });
        }
    },

    async update(req, res) {
        if (!isManagerOrAbove(req.user)) {
            return res.status(403).json({ message: "Only managers or admins can edit themes." });
        }

        try {
            const existing = await Theme.findById(req.params.id);
            if (!existing) {
                return res.status(404).json({ message: "Theme not found." });
            }

            // Built-in themes can only be edited by admins — managers are
            // still blocked, same as before, for anything marked built-in.
            if (existing.builtIn && !isAdmin(req.user)) {
                return res
                    .status(403)
                    .json({ message: "Built-in themes can only be edited by an admin." });
            }

            await Theme.update(req.params.id, req.body, existing.builtIn && isAdmin(req.user));
            const updated = await Theme.findById(req.params.id);
            broadcast("themes:theme-updated", updated);
            res.json(updated);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Failed to update theme." });
        }
    },

    async remove(req, res) {
        if (!isManagerOrAbove(req.user)) {
            return res.status(403).json({ message: "Only managers or admins can delete themes." });
        }

        try {
            const existing = await Theme.findById(req.params.id);
            if (!existing) {
                return res.status(404).json({ message: "Theme not found." });
            }
            // Deleting a built-in theme stays blocked for everyone,
            // including admins — only editing is allowed.
            if (existing.builtIn) {
                return res.status(403).json({ message: "Built-in themes can't be deleted." });
            }

            await Theme.deleteById(req.params.id);
            broadcast("themes:theme-removed", { id: req.params.id });
            res.json({ success: true });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Failed to delete theme." });
        }
    },
};

export default themesController;
