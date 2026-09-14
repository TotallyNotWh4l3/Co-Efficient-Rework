// ===================================================
// ファイル名: scheduleTags.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: スケジュールタグ情報を記録するためのデータベーススキーマ。
// ===================================================


export default `
CREATE TABLE IF NOT EXISTS schedule_tags (
  id          TEXT PRIMARY KEY,           -- slug-style id, e.g. 'meeting'
  color       TEXT NOT NULL,               -- hex color, e.g. '#3b82f6'
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
`;
