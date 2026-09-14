// SQLite can't ALTER an existing foreign key constraint in place, so each
// affected table is recreated with the corrected FK action, its data
// copied across, then swapped in. This fixes two separate problems:
//
// 1. announcements.author_id, schedule_items.author_id, and
//    announcement_reads.user_id had NO ON DELETE behavior at all, which
//    defaults to blocking the parent delete — this is what caused
//    "FOREIGN KEY constraint failed" when deleting a user who had ever
//    posted an announcement, created a schedule event, or read one.
//    - announcements/schedule_items: author_id -> ON DELETE SET NULL.
//      Both tables already snapshot author_name/author_role at post time,
//      so the content survives and still displays correctly even once
//      the author's account is gone; author_id is relaxed to nullable to
//      allow this.
//    - announcement_reads: user_id -> ON DELETE CASCADE. These are just
//      per-user read receipts, safe to remove along with the user.
//
// 2. locations.user_id and themes.user_id were ON DELETE CASCADE despite
//    both tables being shared resources (see themesController.js comment:
//    locations are "no longer per-user... a single shared table everyone
//    reads from"). Left as CASCADE, deleting whichever user originally
//    created a shared location or custom theme would silently delete it
//    for everyone. Changed to ON DELETE SET NULL (user_id relaxed to
//    nullable) so the resource survives; it just becomes unattributed.
const sql = `
PRAGMA foreign_keys = OFF;

BEGIN TRANSACTION;

-- announcements: author_id -> SET NULL
CREATE TABLE announcements_new (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  title           TEXT NOT NULL,
  title_ja        TEXT,
  content         TEXT NOT NULL,
  content_ja      TEXT,
  categories      TEXT NOT NULL DEFAULT '["general"]',
  is_pinned       INTEGER NOT NULL DEFAULT 0,
  author_id       INTEGER,
  author_name     TEXT NOT NULL,
  author_role     TEXT NOT NULL,

  is_edited       INTEGER NOT NULL DEFAULT 0,
  is_deleted      INTEGER NOT NULL DEFAULT 0,
  deleted_at      TEXT,

  is_archived     INTEGER NOT NULL DEFAULT 0,
  archived_at     TEXT,

  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO announcements_new SELECT * FROM announcements;
DROP TABLE announcements;
ALTER TABLE announcements_new RENAME TO announcements;

CREATE INDEX IF NOT EXISTS idx_announcements_active
  ON announcements (is_deleted, is_archived, is_pinned, created_at);
CREATE INDEX IF NOT EXISTS idx_announcements_updated
  ON announcements (updated_at);

-- schedule_items: author_id -> SET NULL
-- (includes subtitle/tags columns added later by migration 012, appended
-- at the end since ALTER TABLE ADD COLUMN always appends)
CREATE TABLE schedule_items_new (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  title           TEXT NOT NULL,
  description     TEXT,

  event_date      TEXT NOT NULL,
  event_time      TEXT NOT NULL,

  author_id       INTEGER,
  author_name     TEXT NOT NULL,
  author_role     TEXT NOT NULL,

  is_edited       INTEGER NOT NULL DEFAULT 0,
  is_deleted      INTEGER NOT NULL DEFAULT 0,
  deleted_at      TEXT,

  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),

  subtitle        TEXT,
  tags            TEXT NOT NULL DEFAULT '[]',

  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO schedule_items_new SELECT * FROM schedule_items;
DROP TABLE schedule_items;
ALTER TABLE schedule_items_new RENAME TO schedule_items;

CREATE INDEX IF NOT EXISTS idx_schedule_active
  ON schedule_items (is_deleted, event_date, event_time);
CREATE INDEX IF NOT EXISTS idx_schedule_updated
  ON schedule_items (updated_at);

-- announcement_reads: user_id -> CASCADE
CREATE TABLE announcement_reads_new (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  announcement_id   INTEGER NOT NULL,
  user_id           INTEGER NOT NULL,
  read_at           TEXT NOT NULL DEFAULT (datetime('now')),

  UNIQUE(announcement_id, user_id),
  FOREIGN KEY (announcement_id) REFERENCES announcements(id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO announcement_reads_new SELECT * FROM announcement_reads;
DROP TABLE announcement_reads;
ALTER TABLE announcement_reads_new RENAME TO announcement_reads;

CREATE INDEX IF NOT EXISTS idx_announcement_reads_user
  ON announcement_reads (user_id);

-- locations: user_id -> SET NULL (shared resource, shouldn't vanish
-- if its original creator's account is deleted)
CREATE TABLE locations_new (
    id TEXT PRIMARY KEY,
    user_id INTEGER,
    name TEXT NOT NULL UNIQUE,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'Asia/Tokyo',
    built_in INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO locations_new SELECT * FROM locations;
DROP TABLE locations;
ALTER TABLE locations_new RENAME TO locations;

-- themes: user_id -> SET NULL (same reasoning as locations)
CREATE TABLE themes_new (
    id TEXT PRIMARY KEY,
    user_id INTEGER,
    name TEXT NOT NULL,
    built_in INTEGER NOT NULL DEFAULT 0,
    based_on TEXT,
    appearance TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO themes_new SELECT * FROM themes;
DROP TABLE themes;
ALTER TABLE themes_new RENAME TO themes;

COMMIT;

PRAGMA foreign_keys = ON;
`;

export default function fixUserForeignKeys(db) {
    return new Promise((resolve, reject) => {
        db.exec(sql, (error) => {
            if (error) {
                reject(error);
                return;
            }
            resolve();
        });
    });
}
