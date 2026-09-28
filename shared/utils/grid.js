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
