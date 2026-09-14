// ===================================================
// ファイル名: dashboardSettings.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ダッシュボード設定情報を記録するためのデータベーススキーマ。
// ===================================================


export default `
CREATE TABLE IF NOT EXISTS dashboard_settings (
    user_id     INTEGER PRIMARY KEY,
    name        TEXT NOT NULL DEFAULT 'Main Dashboard',
    columns     INTEGER NOT NULL DEFAULT 3,
    gap         INTEGER NOT NULL DEFAULT 16,
    padding     INTEGER NOT NULL DEFAULT 16,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
`;
