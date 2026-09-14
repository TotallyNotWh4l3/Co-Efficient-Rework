// ===================================================
// ファイル名: database.js
// 概要: ローカルSQLite (libSQL) データベースへの接続を管理するモジュール
// ===================================================

import { createClient } from "@libsql/client";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

dotenv.config();

// Fully local by default: a file-backed libSQL/SQLite database under
// backend/data/. Override with DB_PATH if you want it elsewhere.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.join(__dirname, "../../data/coefficient.db");

const db = createClient({
    url: `file:${dbPath}`,
});

console.log(`Connected to local SQLite database at ${dbPath}`);

/**
 * Compatibility shims for the 13 migration files in backend/migration/,
 * which are written against sqlite3's callback API and get the raw `db`
 * object passed straight through from migrate.js. Rather than rewrite all
 * 13 files, we attach exec()/run()/serialize() here that speak the same
 * callback shapes but run on top of the libSQL client underneath.
 */

// sqlite3-style db.exec(sql, callback) — multi-statement, no params.
db.exec = function (sql, callback) {
    db.executeMultiple(sql)
        .then(() => callback(null))
        .catch((error) => callback(error));
};

// sqlite3-style db.run(sql, callback) OR db.run(sql, params, callback).
// Used directly (not via dbHelpers) in migration/012, which calls it with
// just (sql, callback) — no params array.
db.run = function (sql, paramsOrCallback, maybeCallback) {
    const hasParams = typeof paramsOrCallback !== "function";
    const params = hasParams ? paramsOrCallback : [];
    const callback = hasParams ? maybeCallback : paramsOrCallback;

    db.execute({ sql, args: params })
        .then(() => callback(null))
        .catch((error) => callback(error));
};

// sqlite3-style db.serialize(fn) — our shimmed calls above are already
// independently promise-based/sequential per migration file, so this
// just needs to invoke fn() synchronously.
db.serialize = function (fn) {
    fn();
};

export default db;
