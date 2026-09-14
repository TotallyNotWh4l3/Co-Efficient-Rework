// ===================================================
// ファイル名: announcementLogs.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: アナウンスメントの操作ログを記録するためのデータベーススキーマ。アナウンスメントの作成、編集、削除などの操作履歴を保持します。
// ===================================================


export default `
CREATE TABLE IF NOT EXISTS announcement_logs (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  announcement_id   INTEGER NOT NULL,
  action            TEXT NOT NULL,   -- 'create' | 'edit' | 'delete' | 'restore' | 'archive' | 'unarchive'
  actor_id          INTEGER NOT NULL,
  actor_name        TEXT NOT NULL,
  actor_role        TEXT NOT NULL,
  before_json       TEXT,
  after_json        TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (announcement_id) REFERENCES announcements(id)
);

CREATE INDEX IF NOT EXISTS idx_announcement_logs_announcement
  ON announcement_logs (announcement_id, created_at);
`;
