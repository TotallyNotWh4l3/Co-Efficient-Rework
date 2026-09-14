// ===================================================
// ファイル名: announcements.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: アナウンスメント情報を記録するためのデータベーススキーマ。
// ===================================================

export default `
CREATE TABLE IF NOT EXISTS announcements (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  title           TEXT NOT NULL,
  title_ja        TEXT,
  content         TEXT NOT NULL,
  content_ja      TEXT,
  categories      TEXT NOT NULL DEFAULT '["general"]',
  is_pinned       INTEGER NOT NULL DEFAULT 0,      -- 0/1
  author_id       INTEGER NOT NULL,
  author_name     TEXT NOT NULL,
  author_role     TEXT NOT NULL,                   -- role at time of posting (for priority display)

  is_edited       INTEGER NOT NULL DEFAULT 0,      -- 0/1, edit details live in announcement_logs
  is_deleted      INTEGER NOT NULL DEFAULT 0,      -- 0/1, soft delete; delete details live in announcement_logs
  deleted_at      TEXT,

  is_archived     INTEGER NOT NULL DEFAULT 0,      -- 0/1
  archived_at     TEXT,

  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_announcements_active
  ON announcements (is_deleted, is_archived, is_pinned, created_at);

CREATE INDEX IF NOT EXISTS idx_announcements_updated
  ON announcements (updated_at);
`;
