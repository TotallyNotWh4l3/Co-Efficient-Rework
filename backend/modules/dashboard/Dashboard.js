
// ===================================================
// ファイル名: Dashboard.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ダッシュボードモデル — CRUD、レイアウト管理
// ===================================================

import { run, get, all } from "../../shared/db/dbHelpers.js";
import { DEFAULT_DASHBOARD } from "../../../shared/constants/defaults/defaultDashboard.js";

function parseModuleRow(row) {
    return {
        id: row.id,
        type: row.type,
        settings: JSON.parse(row.settings_json || "{}"),
        layout: JSON.parse(row.layout_json || '{"w":1,"h":1}'),
    };
}

const Dashboard = {
    /** Creates this user's dashboard row + default modules, only if they don't have one yet. */
    async ensureSeeded(userId) {
        const existing = await get(`SELECT user_id FROM dashboard_settings WHERE user_id = ?`, [userId]);
        if (existing) return;

        await run(
            `INSERT INTO dashboard_settings (user_id, name, columns, gap, padding) VALUES (?, ?, ?, ?, ?)`,
            [
                userId,
                DEFAULT_DASHBOARD.name,
                DEFAULT_DASHBOARD.layout.columns,
                DEFAULT_DASHBOARD.layout.gap,
                DEFAULT_DASHBOARD.layout.padding,
            ],
        );

        const modules = DEFAULT_DASHBOARD.modules ?? [];
        for (const [index, module] of modules.entries()) {
            await run(
                `INSERT INTO dashboard_modules (id, user_id, type, settings_json, layout_json, position)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    crypto.randomUUID(),
                    userId,
                    module.type,
                    JSON.stringify(module.settings ?? {}),
                    JSON.stringify(module.layout ?? { w: 1, h: 1 }),
                    index,
                ],
            );
        }
    },

    async getState(userId) {
        const settingsRow = await get(`SELECT * FROM dashboard_settings WHERE user_id = ?`, [userId]);
        const moduleRows = await all(
            `SELECT * FROM dashboard_modules WHERE user_id = ? ORDER BY position ASC`,
            [userId],
        );

        return {
            id: "main",
            name: settingsRow?.name ?? "Main Dashboard",
            layout: {
                columns: settingsRow?.columns ?? 3,
                gap: settingsRow?.gap ?? 16,
                padding: settingsRow?.padding ?? 16,
            },
            modules: moduleRows.map(parseModuleRow),
        };
    },

    async updateLayout(userId, updates) {
        const fields = [];
        const values = [];

        if (updates.name !== undefined) {
            fields.push("name = ?");
            values.push(updates.name);
        }
        if (updates.columns !== undefined) {
            fields.push("columns = ?");
            values.push(updates.columns);
        }
        if (updates.gap !== undefined) {
            fields.push("gap = ?");
            values.push(updates.gap);
        }
        if (updates.padding !== undefined) {
            fields.push("padding = ?");
            values.push(updates.padding);
        }

        if (fields.length === 0) return Dashboard.getState(userId);

        fields.push("updated_at = datetime('now')");
        values.push(userId);

        await run(`UPDATE dashboard_settings SET ${fields.join(", ")} WHERE user_id = ?`, values);
        return Dashboard.getState(userId);
    },

    async addModule(userId, type, settings) {
        const id = crypto.randomUUID();
        const maxPositionRow = await get(
            `SELECT MAX(position) as maxPos FROM dashboard_modules WHERE user_id = ?`,
            [userId],
        );
        const position = (maxPositionRow?.maxPos ?? -1) + 1;

        await run(
            `INSERT INTO dashboard_modules (id, user_id, type, settings_json, layout_json, position)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [id, userId, type, JSON.stringify(settings ?? {}), JSON.stringify({ w: 1, h: 1 }), position],
        );

        const row = await get(`SELECT * FROM dashboard_modules WHERE id = ? AND user_id = ?`, [id, userId]);
        return parseModuleRow(row);
    },

    async removeModule(userId, moduleId) {
        const { changes } = await run(
            `DELETE FROM dashboard_modules WHERE id = ? AND user_id = ?`,
            [moduleId, userId],
        );
        return changes > 0;
    },

    /** Merges one key into a module's settings blob — matches the frontend's updateModuleSettings(id, key, value). */
    async updateModuleSettings(userId, moduleId, key, value) {
        const row = await get(`SELECT * FROM dashboard_modules WHERE id = ? AND user_id = ?`, [moduleId, userId]);
        if (!row) return null;

        const settings = { ...JSON.parse(row.settings_json || "{}"), [key]: value };

        await run(
            `UPDATE dashboard_modules SET settings_json = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?`,
            [JSON.stringify(settings), moduleId, userId],
        );

        const updated = await get(`SELECT * FROM dashboard_modules WHERE id = ? AND user_id = ?`, [moduleId, userId]);
        return parseModuleRow(updated);
    },
};

export default Dashboard;
