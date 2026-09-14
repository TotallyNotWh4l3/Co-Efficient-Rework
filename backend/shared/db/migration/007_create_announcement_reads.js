// ===================================================
// ファイル名: 007_create_announcement_reads.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: お知らせ閲覧記録テーブルを作成するマイグレーション
// ===================================================


import announcementReadsSchema from "../../../modules/announcements/announcementReads.schema.js";

export default function createAnnouncementReadsTable(db) {
    return new Promise((resolve, reject) => {
        db.exec(announcementReadsSchema, (error) => {
            if (error) {
                reject(error);
                return;
            }

            resolve();
        });
    });
}
