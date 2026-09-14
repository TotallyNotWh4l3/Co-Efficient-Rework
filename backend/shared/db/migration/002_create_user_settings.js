// ===================================================
// ファイル名: 002_create_user_settings.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ユーザー設定テーブルを作成するマイグレーション
// ===================================================

import userSettingsSchema from "../../../modules/settings/userSettings.schema.js";

export default function createUserSettingsTable(db) {
    return new Promise((resolve, reject) => {
        db.exec(userSettingsSchema, (error) => {
            if (error) {
                reject(error);
                return;
            }

            resolve();
        });
    });
}