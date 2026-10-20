// ===================================================
// ファイル名: init.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: データベースの初期化処理。
//       テーブル作成 → マイグレーション → 初期データ投入 を一括で実行する。
//       何度実行しても安全 (作成済み・適用済み・投入済みはスキップ)。
//       使い方: npm run setup:db  (または node shared/db/init.js)
// ===================================================

// backend/database/init.js
import { exec } from "./dbHelpers.js";
import { runMigrations } from "./migration/migrate.js";
import { seedUsers } from "./seed.js";
import { seedLocations } from "./seedLocations.js";
import { seedThemes } from "./seedThemes.js";

import usersTable from "../../modules/auth/users.schema.js";
import userSettingsTable from "../../modules/settings/userSettings.schema.js";
import locations from "../../modules/locations/locations.schema.js";
import weatherData from "../../modules/weather/weatherData.schema.js";
import announcements from "../../modules/announcements/announcements.schema.js";
import announcementLogs from "../../modules/announcements/announcementLogs.schema.js";
import announcementReads from "../../modules/announcements/announcementReads.schema.js";
import scheduleItems from "../../modules/schedule/schedule.schema.js";
import dashboardSettings from "../../modules/dashboard/dashboardSettings.schema.js";
import dashboardModules from "../../modules/dashboard/dashboardModules.schema.js";
import themes from "../../modules/themes/themes.schema.js";

const tables = [
    { name: "Users", sql: usersTable },
    { name: "UserSettings", sql: userSettingsTable },
    { name: "Locations", sql: locations },
    { name: "WeatherData", sql: weatherData },
    { name: "Announcements", sql: announcements },
    { name: "AnnouncementLogs", sql: announcementLogs },
    { name: "AnnouncementReads", sql: announcementReads },
    { name: "ScheduleItems", sql: scheduleItems },
    { name: "DashboardSettings", sql: dashboardSettings },
    { name: "DashboardModules", sql: dashboardModules },
    { name: "Themes", sql: themes },
];

async function createTables() {
    console.log("[Init] Step 1/4: creating tables");

    for (const { name, sql } of tables) {
        try {
            await exec(sql);
            console.log(`${name} table created.`);
        } catch (error) {
            // Stop here: migrations and seeds on top of a missing table
            // would only produce confusing follow-up errors.
            throw new Error(`Failed to create ${name} table: ${error.message}`);
        }
    }
}

async function init() {
    await createTables();

    console.log("[Init] Step 2/4: running migrations");
    await runMigrations();

    // Seeds run after migrations so they write to the final schema.
    // seedUsers must come first: locations and themes are owned by "admin".
    console.log("[Init] Step 3/4: seeding users");
    await seedUsers();

    console.log("[Init] Step 4/4: seeding locations and themes");
    await seedLocations();
    await seedThemes();

    console.log("Database initialization complete.");
}

init()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Database initialization failed:", error.message);
        process.exit(1);
    });
