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
        cellIndex: row.cell_index,
    };
}

/**
 * Expands a module's footprint (its top-left cell_index plus its w/h span)
 * into the individual cell indices it occupies, row-major, wrapping at
 * `columns`. This is the one place that knows how a span maps onto cells —
 * both findFirstFreeCell and anything else that needs to know "what's
 * occupied" should go through this rather than re-deriving it.
 */
function footprint(cellIndex, w, h, columns) {
    const startRow = Math.floor(cellIndex / columns);
    const startCol = cellIndex % columns;
    const cells = [];
    for (let dr = 0; dr < h; dr += 1) {
        for (let dc = 0; dc < w; dc += 1) {
            cells.push((startRow + dr) * columns + (startCol + dc));
        }
    }
    return cells;
}

/**
 * Finds the first empty cell (lowest index, row-major) that a w x h module
 * can be placed into without overlapping an existing module or spilling
 * past the right edge of the grid. If the module doesn't fit anywhere in
 * the current rows x columns grid, grows the grid by one row at a time
 * until it does — a cell only ever becomes "invisible" (empty) by a module
 * being removed from it, never by the grid refusing to hold a new module.
 */
function findFirstFreeCell(existingModules, columns, rows, w, h) {
    const occupied = new Set();
    for (const module of existingModules) {
        const mw = module.layout?.w ?? 1;
        const mh = module.layout?.h ?? 1;
        for (const cell of footprint(module.cellIndex, mw, mh, columns)) {
            occupied.add(cell);
        }
    }

    let gridRows = rows;
    for (;;) {
        const totalCells = columns * gridRows;
        for (let index = 0; index < totalCells; index += 1) {
            const startCol = index % columns;
            if (startCol + w > columns) continue; // would spill off the right edge
            const startRow = Math.floor(index / columns);
            if (startRow + h > gridRows) continue; // would spill past the bottom edge

            const candidateCells = footprint(index, w, h, columns);
            if (candidateCells.every((cell) => !occupied.has(cell))) {
                return { cellIndex: index, rows: gridRows };
            }
        }
        // Nothing fits in the current grid — grow it by one row and try again.
        gridRows += 1;
    }
}

const Dashboard = {
    /** Creates this user's dashboard row + default modules, only if they don't have one yet. */
    async ensureSeeded(userId) {
        const existing = await get(`SELECT user_id FROM dashboard_settings WHERE user_id = ?`, [
            userId,
        ]);
        if (existing) return;

        await run(
            `INSERT INTO dashboard_settings (user_id, name, columns, rows, gap, padding) VALUES (?, ?, ?, ?, ?, ?)`,
            [
                userId,
                DEFAULT_DASHBOARD.name,
                DEFAULT_DASHBOARD.layout.columns,
                DEFAULT_DASHBOARD.layout.rows,
                DEFAULT_DASHBOARD.layout.gap,
                DEFAULT_DASHBOARD.layout.padding,
            ],
        );

        const modules = DEFAULT_DASHBOARD.modules ?? [];
        for (const module of modules) {
            await run(
                `INSERT INTO dashboard_modules (id, user_id, type, settings_json, layout_json, cell_index)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    crypto.randomUUID(),
                    userId,
                    module.type,
                    JSON.stringify(module.settings ?? {}),
                    JSON.stringify(module.layout ?? { w: 1, h: 1 }),
                    module.cellIndex ?? 0,
                ],
            );
        }
    },

    async getState(userId) {
        const settingsRow = await get(`SELECT * FROM dashboard_settings WHERE user_id = ?`, [
            userId,
        ]);
        const moduleRows = await all(
            `SELECT * FROM dashboard_modules WHERE user_id = ? ORDER BY cell_index ASC`,
            [userId],
        );

        return {
            id: "main",
            name: settingsRow?.name ?? "Main Dashboard",
            layout: {
                columns: settingsRow?.columns ?? 3,
                rows: settingsRow?.rows ?? 4,
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
        if (updates.rows !== undefined) {
            fields.push("rows = ?");
            values.push(updates.rows);
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

    /**
     * Adds a module into the first empty (invisible) cell it fits in —
     * never just appended after the last module — so gaps a user left
     * between existing modules get filled before any new row is used, and
     * the grid only grows past its configured row count if it genuinely
     * has no room left.
     *
     * `layout` is the module's requested cell-span ({ w, h }), picked by
     * the user from a fixed set of sizes (1x1, 2x1, 1x2, 2x2, ...) rather
     * than freeform pixel dragging. Defaults to 1x1 to preserve existing
     * behavior for any caller that doesn't pass one. Spans wider or taller
     * than the grid itself are clamped down to fit, since a module that
     * could never be placed would otherwise loop addModule forever.
     */
    async addModule(userId, type, settings, layout) {
        const settingsRow = await get(
            `SELECT columns, rows FROM dashboard_settings WHERE user_id = ?`,
            [userId],
        );
        const columns = settingsRow?.columns ?? 3;
        const configuredRows = settingsRow?.rows ?? 4;

        const existingRows = await all(
            `SELECT cell_index, layout_json FROM dashboard_modules WHERE user_id = ?`,
            [userId],
        );
        const existingModules = existingRows.map((row) => ({
            cellIndex: row.cell_index,
            layout: JSON.parse(row.layout_json || '{"w":1,"h":1}'),
        }));

        const w = Math.max(1, Math.min(columns, layout?.w ?? 1));
        const h = Math.max(1, layout?.h ?? 1);
        const { cellIndex, rows: neededRows } = findFirstFreeCell(
            existingModules,
            columns,
            configuredRows,
            w,
            h,
        );

        if (neededRows !== configuredRows) {
            await run(
                `UPDATE dashboard_settings SET rows = ?, updated_at = datetime('now') WHERE user_id = ?`,
                [neededRows, userId],
            );
        }

        const id = crypto.randomUUID();
        await run(
            `INSERT INTO dashboard_modules (id, user_id, type, settings_json, layout_json, cell_index)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [id, userId, type, JSON.stringify(settings ?? {}), JSON.stringify({ w, h }), cellIndex],
        );

        const row = await get(`SELECT * FROM dashboard_modules WHERE id = ? AND user_id = ?`, [
            id,
            userId,
        ]);
        return parseModuleRow(row);
    },

    /**
     * Changes an existing module's cell-span (e.g. 1x1 -> 2x1). Tries to
     * keep the module at its current cell_index first — if the new span
     * still fits there without overlapping any other module or spilling
     * off the grid, only layout_json changes. Otherwise it's re-placed
     * into the first free cell the new span fits in (growing the grid by
     * a row if needed), the same rule addModule uses.
     */
    async updateModuleLayout(userId, moduleId, layout) {
        const target = await get(`SELECT * FROM dashboard_modules WHERE id = ? AND user_id = ?`, [
            moduleId,
            userId,
        ]);
        if (!target) return null;

        const settingsRow = await get(
            `SELECT columns, rows FROM dashboard_settings WHERE user_id = ?`,
            [userId],
        );
        const columns = settingsRow?.columns ?? 3;
        const configuredRows = settingsRow?.rows ?? 4;

        const w = Math.max(1, Math.min(columns, layout?.w ?? 1));
        const h = Math.max(1, layout?.h ?? 1);

        const otherRows = await all(
            `SELECT cell_index, layout_json FROM dashboard_modules WHERE user_id = ? AND id != ?`,
            [userId, moduleId],
        );
        const otherModules = otherRows.map((row) => ({
            cellIndex: row.cell_index,
            layout: JSON.parse(row.layout_json || '{"w":1,"h":1}'),
        }));

        const occupied = new Set();
        for (const module of otherModules) {
            for (const cell of footprint(
                module.cellIndex,
                module.layout?.w ?? 1,
                module.layout?.h ?? 1,
                columns,
            )) {
                occupied.add(cell);
            }
        }

        const startCol = target.cell_index % columns;
        const startRow = Math.floor(target.cell_index / columns);
        const fitsInPlace =
            startCol + w <= columns &&
            startRow + h <= configuredRows &&
            footprint(target.cell_index, w, h, columns).every((cell) => !occupied.has(cell));

        let cellIndex = target.cell_index;
        if (!fitsInPlace) {
            const placed = findFirstFreeCell(otherModules, columns, configuredRows, w, h);
            cellIndex = placed.cellIndex;
            if (placed.rows !== configuredRows) {
                await run(
                    `UPDATE dashboard_settings SET rows = ?, updated_at = datetime('now') WHERE user_id = ?`,
                    [placed.rows, userId],
                );
            }
        }

        await run(
            `UPDATE dashboard_modules SET layout_json = ?, cell_index = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?`,
            [JSON.stringify({ w, h }), cellIndex, moduleId, userId],
        );

        const updated = await get(`SELECT * FROM dashboard_modules WHERE id = ? AND user_id = ?`, [
            moduleId,
            userId,
        ]);
        return parseModuleRow(updated);
    },

    async removeModule(userId, moduleId) {
        // No cell bookkeeping needed here — a cell's "occupied" state is
        // derived from which modules currently reference it (see
        // findFirstFreeCell), so deleting the row alone is what makes the
        // cell invisible/empty again.
        const { changes } = await run(
            `DELETE FROM dashboard_modules WHERE id = ? AND user_id = ?`,
            [moduleId, userId],
        );
        return changes > 0;
    },

    /** Merges one key into a module's settings blob — matches the frontend's updateModuleSettings(id, key, value). */
    async updateModuleSettings(userId, moduleId, key, value) {
        const row = await get(`SELECT * FROM dashboard_modules WHERE id = ? AND user_id = ?`, [
            moduleId,
            userId,
        ]);
        if (!row) return null;

        const settings = { ...JSON.parse(row.settings_json || "{}"), [key]: value };

        await run(
            `UPDATE dashboard_modules SET settings_json = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?`,
            [JSON.stringify(settings), moduleId, userId],
        );

        const updated = await get(`SELECT * FROM dashboard_modules WHERE id = ? AND user_id = ?`, [
            moduleId,
            userId,
        ]);
        return parseModuleRow(updated);
    },
};

export default Dashboard;
