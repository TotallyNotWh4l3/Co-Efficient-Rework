// ===================================================
// ファイル名: userSettings.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ユーザー設定情報を記録するためのデータベーススキーマ。
// ===================================================


export default `
CREATE TABLE IF NOT EXISTS user_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL UNIQUE,

    settings_json TEXT NOT NULL,

    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
`;