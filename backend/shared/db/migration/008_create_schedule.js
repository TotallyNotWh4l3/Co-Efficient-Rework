// ===================================================
// ファイル名: 008_create_schedule.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: スケジュールテーブルを作成するマイグレーション
// ===================================================


import scheduleSchema from "../../../modules/schedule/schedule.schema.js";

export default function createScheduleTable(db) {
    return new Promise((resolve, reject) => {
        db.exec(scheduleSchema, (error) => {
            if (error) {
                reject(error);
                return;
            }

            resolve();
        });
    });
}
