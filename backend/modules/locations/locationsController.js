// ===================================================
// ファイル名: locationsController.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 位置情報の管理を行うAPIコントローラー。位置情報の作成、更新、削除、および取得などの機能を提供します。
// ===================================================


// backend/controllers/locationsController.js
import crypto from "node:crypto";
import Location from "./Location.js";
import { broadcast } from "../../sse/SSEController.js";

const isManagerOrAbove = (user) => ["manager", "admin"].includes(user.role?.toLowerCase());

const locationsController = {
    async getAll(req, res) {
        try {
            res.json(await Location.findAll());
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Failed to load locations." });
        }
    },

    async create(req, res) {
        if (!isManagerOrAbove(req.user)) {
            return res.status(403).json({ message: "Only managers or admins can add locations." });
        }

        const { name, latitude, longitude, timezone } = req.body;

        if (!name || latitude === undefined || longitude === undefined) {
            return res.status(400).json({ message: "Name, latitude, and longitude are required." });
        }

        try {
            const id = crypto.randomUUID();
            await Location.create({
                id,
                userId: req.user.id,
                name,
                latitude,
                longitude,
                timezone,
                builtIn: false,
            });

            const created = await Location.findById(id);
            broadcast("locations:location-created", created);
            res.status(201).json(created);
        } catch (error) {
            console.error(error);
            if (error.message?.includes("UNIQUE constraint failed")) {
                return res
                    .status(400)
                    .json({ message: "A location with that name already exists." });
            }
            res.status(500).json({ message: "Failed to create location." });
        }
    },

    async update(req, res) {
        if (!isManagerOrAbove(req.user)) {
            return res.status(403).json({ message: "Only managers or admins can edit locations." });
        }

        try {
            const existing = await Location.findById(req.params.id);
            if (!existing) {
                return res.status(404).json({ message: "Location not found." });
            }

            await Location.update(req.params.id, req.body);
            const updated = await Location.findById(req.params.id);
            broadcast("locations:location-updated", updated);
            res.json(updated);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Failed to update location." });
        }
    },

    async remove(req, res) {
        if (!isManagerOrAbove(req.user)) {
            return res
                .status(403)
                .json({ message: "Only managers or admins can delete locations." });
        }

        try {
            const existing = await Location.findById(req.params.id);
            if (!existing) {
                return res.status(404).json({ message: "Location not found." });
            }
            if (existing.builtIn) {
                return res.status(403).json({ message: "Built-in locations can't be deleted." });
            }

            await Location.deleteById(req.params.id);
            broadcast("locations:location-removed", { id: req.params.id });
            res.json({ success: true });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Failed to delete location." });
        }
    },
};

export default locationsController;
