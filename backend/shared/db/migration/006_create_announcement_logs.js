// ===================================================
// ファイル名: 006_create_announcement_logs.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: お知らせログテーブルを作成するマイグレーション
// ===================================================


import announcementLogsSchema from "../../../modules/announcements/announcementLogs.schema.js";

export default function createAnnouncementLogsTable(db) {
    return new Promise((resolve, reject) => {
        db.exec(announcementLogsSchema, (error) => {
            if (error) {
                reject(error);
                return;
            }

            resolve();
        });
    });
}
