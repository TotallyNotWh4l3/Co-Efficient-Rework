// ===================================================
// ファイル名: users.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ユーザー情報を記録するためのデータベーススキーマ
// ===================================================


export default `
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    username TEXT NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    role TEXT NOT NULL DEFAULT 'user',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;
