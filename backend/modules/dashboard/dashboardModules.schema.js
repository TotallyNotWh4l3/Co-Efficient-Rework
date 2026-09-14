// ===================================================
// ファイル名: dashboardModules.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ダッシュボードモジュール情報を記録するためのデータベーススキーマ。
// ===================================================


export default `
CREATE TABLE IF NOT EXISTS dashboard_modules (
    id              TEXT PRIMARY KEY,
    user_id         INTEGER NOT NULL,
    type            TEXT NOT NULL,
    settings_json   TEXT NOT NULL DEFAULT '{}',
    layout_json     TEXT NOT NULL DEFAULT '{"w":1,"h":1}',
    position        INTEGER NOT NULL DEFAULT 0,

    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dashboard_modules_user_position
    ON dashboard_modules (user_id, position);
`;
