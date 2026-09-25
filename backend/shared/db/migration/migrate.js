// ===================================================
// ファイル名: migrate.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: データベースのマイグレーションを実行するスクリプト。
// ===================================================

import db from "../database.js";

import createUsersTable from "./001_create_users.js";
import createUserSettingsTable from "./002_create_user_settings.js";
import createLocationsTable from "./003_create_location.js";
import createWeatherDataTable from "./004_create_weather_data.js";
import createAnnouncementsTable from "./005_create_announcements.js";
import createAnnouncementLogsTable from "./006_create_announcement_logs.js";
import createAnnouncementReadsTable from "./007_create_announcement_reads.js";
import createScheduleTable from "./008_create_schedule.js";
import createDashboardSettingsTable from "./009_create_dashboard_settings.js";
import createDashboardModulesTable from "./010_create_dashboard_modules.js";
import createScheduleTagsTable from "./011_create_schedule_tags.js";
import addScheduleSubtitleAndTags from "./012_add_schedule_subtitle_and_tags_column.js";
import createThemesTable from "./013_create_themes.js";
import addWeatherFetchClaimColumn from "./014_create_weather_fetch_claim_column.js";
import fixUserForeignKeys from "./015_fix_foreign_keys.js";
import addDashboardGridPlacement from "./016_dashboard_grid_placement.js";

const migrations = [
    { name: "001_create_users", up: createUsersTable },
    { name: "002_create_user_settings", up: createUserSettingsTable },
    { name: "003_create_location", up: createLocationsTable },
    { name: "004_create_weather_data", up: createWeatherDataTable },
    { name: "005_create_announcements", up: createAnnouncementsTable },
    { name: "006_create_announcement_logs", up: createAnnouncementLogsTable },
    { name: "007_create_announcement_reads", up: createAnnouncementReadsTable },
    { name: "008_create_schedule", up: createScheduleTable },
    { name: "009_create_dashboard_settings", up: createDashboardSettingsTable },
    { name: "010_create_dashboard_modules", up: createDashboardModulesTable },
    { name: "011_create_schedule_tags", up: createScheduleTagsTable },
    { name: "012_add_schedule_subtitle_and_tags_column", up: addScheduleSubtitleAndTags },
    { name: "013_create_themes", up: createThemesTable },
    { name: "014_add_weather_fetch_claim", up: addWeatherFetchClaimColumn },
    { name: "015_fix_user_foreign_keys", up: fixUserForeignKeys },
    { name: "016_dashboard_grid_placement", up: addDashboardGridPlacement },

];

async function runMigrations() {
    for (const migration of migrations) {
        await migration.up(db);
        console.log(`[Migrate] Applied: ${migration.name}`);
    }

    console.log("[Migrate] All migrations applied.");
}

runMigrations()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("[Migrate] Failed:", error);
        process.exit(1);
    });
