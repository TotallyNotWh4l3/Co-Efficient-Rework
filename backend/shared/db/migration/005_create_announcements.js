// ===================================================
// ファイル名: 005_create_announcements.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: アナウンスメントテーブルを作成するマイグレーション
// ===================================================


// 005_create_announcements.js
import announcementsSchema from "../../../modules/announcements/announcements.schema.js";

export default function createAnnouncementsTable(db) {
    return new Promise((resolve, reject) => {
        db.exec(announcementsSchema, (error) => {
            if (error) {
                reject(error);
                return;
            }
            resolve();
        });
    });
}