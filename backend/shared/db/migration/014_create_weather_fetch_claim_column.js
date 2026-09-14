// ===================================================
// ファイル名: 014_create_weather_fetch_claim_column.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 天気データテーブルにfetch_claimed_at列を追加するマイグレーション
// ===================================================


const sql = `
ALTER TABLE weather_data ADD COLUMN fetch_claimed_at DATETIME;
`;

export default function addWeatherFetchClaimColumn(db) {
    return new Promise((resolve, reject) => {
        db.exec(sql, (error) => {
            if (error) {
                // Re-running migrations is expected to be idempotent — every
                // other migration here uses CREATE TABLE IF NOT EXISTS.
                // ALTER TABLE ADD COLUMN has no equivalent guard, so treat
                // "column already exists" as success instead of aborting
                // the whole migration run on a second execution.
                if (/duplicate column name/i.test(error.message || "")) {
                    resolve();
                    return;
                }
                reject(error);
                return;
            }
            resolve();
        });
    });
}
