// ===================================================
// ファイル名: 010_create_dashboard_modules.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ダッシュボードモジュールテーブルを作成するマイグレーション
// ===================================================


import dashboardModulesSchema from "../../../modules/dashboard/dashboardModules.schema.js";

export default function createDashboardModulesTable(db) {
    return new Promise((resolve, reject) => {
        db.exec(dashboardModulesSchema, (error) => {
            if (error) {
                reject(error);
                return;
            }

            resolve();
        });
    });
}
