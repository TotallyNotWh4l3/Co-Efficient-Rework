// ===================================================
// ファイル名: 016_dashboard_grid_placement.js
// 概要: Invisible-placeholder grid support.
//
// 1. dashboard_settings.rows — the grid was previously only bounded by
//    columns, with rows growing implicitly forever (grid-auto-rows).
//    Giving it an explicit row count too makes the layout a genuinely
//    fixed-size grid (rows x columns), which is what lets a cell be
//    explicitly "empty" instead of the grid just ending wherever the
//    last module happens to be.
//
// 2. dashboard_modules.position -> cell_index — this column always held
//    a plain append-order integer (0, 1, 2, ...), which the frontend
//    rendered via CSS grid-auto-flow: row dense. Dense auto-flow packs
//    every module into the next free slot in DOM order, so it silently
//    erases any intentional gap a user left between modules. Renaming
//    it to cell_index and (frontend-side) placing each module at that
//    exact grid cell — row = floor(index / columns), col = index %
//    columns — instead of relying on source order is what actually
//    lets a cell stay empty on purpose.
// ===================================================

// Each step checks the current schema first. The two statements used to run
// as one multi-statement block, so a failure after the first left the column
// added but the migration unrecorded, and every re-run then died on
// "duplicate column name". Checking first makes it safe to re-run.
async function hasColumn(db, table, column) {
    const result = await db.execute(`PRAGMA table_info(${table})`);
    return result.rows.some((row) => row.name === column);
}

export default async function addDashboardGridPlacement(db) {
    if (!(await hasColumn(db, "dashboard_settings", "rows"))) {
        await db.execute(
            "ALTER TABLE dashboard_settings ADD COLUMN rows INTEGER NOT NULL DEFAULT 4",
        );
    }

    if (
        (await hasColumn(db, "dashboard_modules", "position")) &&
        !(await hasColumn(db, "dashboard_modules", "cell_index"))
    ) {
        await db.execute("ALTER TABLE dashboard_modules RENAME COLUMN position TO cell_index");
    }
}
