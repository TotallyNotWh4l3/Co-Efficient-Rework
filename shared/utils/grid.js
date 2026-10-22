// ===================================================
// ファイル名: grid.js
// 概要: ダッシュボードグリッドの共通ロジック（フロント/バックエンド共用）
// ===================================================

/**
 * Expands a module's footprint (its top-left cell_index plus its w/h span)
 * into the individual cell indices it occupies, row-major, wrapping at
 * `columns`. The one place that knows how a span maps onto cells — the
 * backend's placement/validation and the position preview both use it, so
 * "what's occupied" can never disagree between them.
 */
export function footprint(cellIndex, w, h, columns) {
    const startRow = Math.floor(cellIndex / columns);
    const startCol = cellIndex % columns;
    const cells = [];
    for (let dr = 0; dr < h; dr += 1) {
        for (let dc = 0; dc < w; dc += 1) {
            // A span that runs past the right edge must NOT wrap onto the
            // next row's cells (index arithmetic would silently do that and
            // create phantom "occupied" cells that block valid moves).
            if (startCol + dc >= columns) continue;
            cells.push((startRow + dr) * columns + (startCol + dc));
        }
    }
    return cells;
}

/**
 * Can a w x h module have its top-left corner at (col, row)?
 * `others` are the other modules ({ cellIndex, layout: { w, h } }) — pass
 * the list WITHOUT the module being moved, so it never collides with itself.
 *
 * Returns { ok: true } or { ok: false, reason: "out_of_bounds" | "occupied" }.
 */
export function canPlaceAt({ col, row, w, h, columns, rows, others }) {
    if (col < 0 || row < 0 || col + w > columns || row + h > rows) {
        return { ok: false, reason: "out_of_bounds" };
    }

    const occupied = new Set();
    for (const other of others) {
        for (const cell of footprint(
            other.cellIndex,
            other.layout?.w ?? 1,
            other.layout?.h ?? 1,
            columns,
        )) {
            occupied.add(cell);
        }
    }

    const collides = footprint(row * columns + col, w, h, columns).some((cell) =>
        occupied.has(cell),
    );
    return collides ? { ok: false, reason: "occupied" } : { ok: true };
}

/**
 * Lays modules out for a new grid size WITHOUT forgetting where the user put
 * them. Each module carries a "home" cell (layout.hc / layout.hr — column and
 * row, independent of the column count) that only a deliberate move / add /
 * resize changes. Changing the grid never rewrites a home, so growing the grid
 * back puts every module exactly where it was.
 *
 * Placement is deterministic:
 *   1. every module whose home still fits (inside the grid, no collision)
 *      stays exactly there;
 *   2. only the rest are relocated, each to the free cell NEAREST its home
 *      (not "first free from the top-left"), growing the row count only when
 *      there is genuinely no room.
 *
 * modules: [{ id, cellIndex, layout: { w, h, hc?, hr? } }]. A module without a
 * stored home (older data) takes it from cellIndex under `oldColumns`.
 * Returns { rows, modules: [{ id, cellIndex, layout }] } in input order.
 */
export function reflowModules(modules, oldColumns, newColumns, newRows) {
    const oldCols = Math.max(1, oldColumns);
    const items = modules.map((m) => ({
        id: m.id,
        hc: m.layout?.hc ?? m.cellIndex % oldCols,
        hr: m.layout?.hr ?? Math.floor(m.cellIndex / oldCols),
        w: Math.max(1, Math.min(newColumns, m.layout?.w ?? 1)),
        h: Math.max(1, m.layout?.h ?? 1),
    }));
    items.sort((a, b) => a.hr - b.hr || a.hc - b.hc);

    const occupied = new Set();
    const free = (col, row, w, h) => {
        for (let r = row; r < row + h; r += 1) {
            for (let c = col; c < col + w; c += 1) {
                if (occupied.has(`${r},${c}`)) return false;
            }
        }
        return true;
    };
    const take = (col, row, w, h) => {
        for (let r = row; r < row + h; r += 1) {
            for (let c = col; c < col + w; c += 1) occupied.add(`${r},${c}`);
        }
    };

    let rows = Math.max(1, newRows);
    const placed = new Map();

    // Pass 1: homes that still fit stay put.
    for (const item of items) {
        if (
            item.hc + item.w <= newColumns &&
            item.hr + item.h <= rows &&
            free(item.hc, item.hr, item.w, item.h)
        ) {
            take(item.hc, item.hr, item.w, item.h);
            placed.set(item.id, { col: item.hc, row: item.hr });
        }
    }

    // Pass 2: the rest go to the nearest free spot to their home.
    for (const item of items) {
        if (placed.has(item.id)) continue;
        let best = null;
        for (;;) {
            for (let r = 0; r + item.h <= rows; r += 1) {
                for (let c = 0; c + item.w <= newColumns; c += 1) {
                    if (!free(c, r, item.w, item.h)) continue;
                    const dist = Math.abs(c - item.hc) + Math.abs(r - item.hr);
                    if (!best || dist < best.dist) best = { c, r, dist };
                }
            }
            if (best) break;
            rows += 1; // no room anywhere: grow the grid by a row and look again
        }
        take(best.c, best.r, item.w, item.h);
        placed.set(item.id, { col: best.c, row: best.r });
    }

    const byId = new Map(items.map((i) => [i.id, i]));
    return {
        rows,
        modules: modules.map((m) => {
            const it = byId.get(m.id);
            const pos = placed.get(m.id);
            return {
                id: m.id,
                cellIndex: pos.row * newColumns + pos.col,
                // home (hc/hr) is carried over untouched
                layout: { w: it.w, h: it.h, hc: it.hc, hr: it.hr },
            };
        }),
    };
}
