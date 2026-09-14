// ===================================================
// ファイル名: backfillLocations.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 既存のユーザー設定から位置情報をバックフィルする
// ===================================================


import db from "./database.js";

db.all(`SELECT id, user_id, settings_json FROM user_settings`, [], (error, rows) => {
    if (error) {
        console.error("Failed to read user_settings:", error.message);
        process.exit(1);
    }

    if (rows.length === 0) {
        console.log("No user_settings rows found — nothing to backfill.");
        process.exit(0);
    }

    let remaining = 0;

    for (const row of rows) {
        const settings = JSON.parse(row.settings_json);
        const locations = settings.locations || [];

        for (const loc of locations) {
            remaining++;

            db.run(
                `
                INSERT OR IGNORE INTO locations (
                    id, user_id, name, latitude, longitude, timezone, built_in
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    loc.id,
                    row.user_id,
                    loc.name,
                    loc.latitude,
                    loc.longitude,
                    loc.timezone ?? "Asia/Tokyo",
                    loc.builtIn ? 1 : 0,
                ],
                function (err) {
                    remaining--;
                    if (err) {
                        console.error(
                            `Failed to insert location ${loc.id} for user ${row.user_id}:`,
                            err.message,
                        );
                    } else {
                        console.log(
                            `Inserted location "${loc.name}" (${loc.id}) for user ${row.user_id}`,
                        );
                    }
                    if (remaining === 0) {
                        db.close(() => console.log("Backfill complete."));
                    }
                },
            );
        }
    }
});
