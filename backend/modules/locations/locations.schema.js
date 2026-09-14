// ===================================================
// ファイル名: locations.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 位置情報を記録するためのデータベーススキーマ。
// ===================================================

export default `
CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY,

    user_id INTEGER NOT NULL,

    name TEXT NOT NULL UNIQUE,

    latitude REAL NOT NULL,
    longitude REAL NOT NULL,

    timezone TEXT NOT NULL DEFAULT 'Asia/Tokyo',

    built_in INTEGER NOT NULL DEFAULT 0,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
`;
