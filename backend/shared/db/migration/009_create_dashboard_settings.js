// ===================================================
// ファイル名: 009_create_dashboard_settings.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ダッシュボード設定テーブルを作成するマイグレーション
// ===================================================


import dashboardSettingsSchema from "../../../modules/dashboard/dashboardSettings.schema.js";

export default function createDashboardSettingsTable(db) {
    return new Promise((resolve, reject) => {
        db.exec(dashboardSettingsSchema, (error) => {
            if (error) {
                reject(error);
                return;
            }

            resolve();
        });
    });
}
