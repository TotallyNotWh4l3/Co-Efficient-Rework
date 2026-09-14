// ===================================================
// ファイル名: init.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: データベースの初期化処理
// ===================================================


// backend/database/init.js
import { exec } from "./dbHelpers.js";

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

async function init() {
    for (const { name, sql } of tables) {
        try {
            await exec(sql);
            console.log(`${name} table created.`);
        } catch (error) {
            console.error(`Failed to create ${name} table:`, error.message);
        }
    }

    console.log("Database initialization complete.");
}

init().then(() => process.exit(0));

