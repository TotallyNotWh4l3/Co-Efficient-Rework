// ===================================================
// ファイル名: schedule.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: スケジュール情報を記録するためのデータベーススキーマ。
// ===================================================

export default `
CREATE TABLE IF NOT EXISTS schedule_items (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  title           TEXT NOT NULL,
  description     TEXT,

  event_date      TEXT NOT NULL,                   -- 'YYYY-MM-DD'
  event_time      TEXT NOT NULL,                    -- 'HH:MM' 24hr

  author_id       INTEGER NOT NULL,
  author_name     TEXT NOT NULL,
  author_role     TEXT NOT NULL,                    -- role at time of posting, mirrors announcements

  is_edited       INTEGER NOT NULL DEFAULT 0,       -- 0/1
  is_deleted      INTEGER NOT NULL DEFAULT 0,       -- 0/1, soft delete
  deleted_at      TEXT,

  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_schedule_active
  ON schedule_items (is_deleted, event_date, event_time);

CREATE INDEX IF NOT EXISTS idx_schedule_updated
  ON schedule_items (updated_at);
`;
