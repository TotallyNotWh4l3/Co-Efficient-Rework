// ===================================================
// ファイル名: 003_create_location.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ロケーションテーブルを作成するマイグレーション
// ===================================================

import locationsSchema from "../../../modules/locations/locations.schema.js";

export default function createLocationsTable(db) {
    return new Promise((resolve, reject) => {
        db.exec(locationsSchema, (error) => {
            if (error) {
                reject(error);
                return;
            }
            resolve();
        });
    });
}