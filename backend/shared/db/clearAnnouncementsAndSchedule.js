// ===================================================
// ファイル名: clearAnnouncementsAndSchedule.js
// 概要: announcements と schedule 関連テーブルの「データのみ」を削除するスクリプト。
//       テーブル定義・カラムはそのまま残す（DROPしない）。
// 使い方:
//   node shared/db/clearAnnouncementsAndSchedule.js --confirm
//   node shared/db/clearAnnouncementsAndSchedule.js --confirm --with-tags
// ===================================================

import db from "./database.js";

// Order matters: child tables (FK -> announcements.id) must be cleared
// before the parent table.
const ANNOUNCEMENT_TABLES = ["announcement_logs", "announcement_reads", "announcements"];

// schedule_items has no child tables (tags are stored inline as JSON,
// not a real FK relationship).
const SCHEDULE_TABLES = ["schedule_items"];

// schedule_tags is a small preset/config table (tag id -> color), not
// event data — left alone unless --with-tags is passed explicitly.
const SCHEDULE_TAG_TABLE = "schedule_tags";

async function tableExists(name) {
    const result = await db.execute({
        sql: `SELECT name FROM sqlite_master WHERE type='table' AND name = ?`,
        args: [name],
    });
    return result.rows.length > 0;
}

async function clearTable(name) {
    if (!(await tableExists(name))) {
        console.log(`  skip: "${name}" does not exist.`);
        return;
    }

    const before = await db.execute({ sql: `SELECT COUNT(*) as count FROM ${name}` });
    const rowCount = before.rows[0]?.count ?? 0;

    await db.execute({ sql: `DELETE FROM ${name}` });

    // Reset the AUTOINCREMENT counter too, so next inserted row starts
    // back at 1 instead of continuing from wherever it left off. Harmless
    // no-op if the table doesn't use AUTOINCREMENT (sqlite_sequence just
    // won't have a row for it).
    await db.execute({
        sql: `DELETE FROM sqlite_sequence WHERE name = ?`,
        args: [name],
    });

    console.log(`  cleared "${name}" (${rowCount} row${rowCount === 1 ? "" : "s"} removed).`);
}

async function main() {
    const args = process.argv.slice(2);

    if (!args.includes("--confirm")) {
        console.error(
            "This deletes ALL announcement and schedule data (rows only — tables/columns are untouched).\n" +
                "Re-run with --confirm to proceed:\n" +
                "  node shared/db/clearAnnouncementsAndSchedule.js --confirm\n" +
                "Add --with-tags to also clear schedule_tags presets.",
        );
        process.exit(1);
    }

    const includeTags = args.includes("--with-tags");

    console.log("Clearing announcements data...");
    for (const table of ANNOUNCEMENT_TABLES) {
        await clearTable(table);
    }

    console.log("Clearing schedule data...");
    for (const table of SCHEDULE_TABLES) {
        await clearTable(table);
    }

    if (includeTags) {
        console.log("Clearing schedule tag presets...");
        await clearTable(SCHEDULE_TAG_TABLE);
    } else {
        console.log(`Leaving "${SCHEDULE_TAG_TABLE}" alone (pass --with-tags to clear it too).`);
    }

    console.log("Done. No tables or columns were dropped — only row data was removed.");
    process.exit(0);
}

main().catch((err) => {
    console.error("Failed to clear data:", err);
    process.exit(1);
});
