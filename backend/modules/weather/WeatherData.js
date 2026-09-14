
// ===================================================
// ファイル名: WeatherData.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 天気データモデル — CRUD、キャッシング、クレーム管理
// ===================================================

import db from "../../shared/db/database.js";

async function findByLocationId(locationId) {
    const result = await db.execute({
        sql: `
            SELECT *
            FROM weather_data
            WHERE location_id = ?
        `,
        args: [locationId],
    });

    const row = result.rows[0];
    if (!row) return null;

    return {
        ...row,
        payload: JSON.parse(row.payload_json),
    };
}

// Every location currently holding a cached forecast — i.e. the set of
// locations someone has actually requested weather for at least once.
// Used by weatherScheduler to know what's worth proactively refreshing.
async function findAllCachedLocationIds() {
    const result = await db.execute({
        sql: `SELECT DISTINCT location_id FROM weather_data`,
        args: [],
    });
    return result.rows.map((row) => row.location_id);
}

/**
 * Upserts the single cached row for a location — we only ever need the
 * latest cached forecast per location, not a history. Also clears any
 * fetch claim, since a successful write means the refetch this claim was
 * guarding has completed.
 */
async function upsert(locationId, weatherTimestamp, payload) {
    const result = await db.execute({
        sql: `
            INSERT INTO weather_data (
                location_id,
                weather_timestamp,
                payload_json,
                fetched_at,
                fetch_claimed_at
            )
            VALUES (?, ?, ?, CURRENT_TIMESTAMP, NULL)
            ON CONFLICT(location_id) DO UPDATE SET
                weather_timestamp = excluded.weather_timestamp,
                payload_json = excluded.payload_json,
                fetched_at = CURRENT_TIMESTAMP,
                fetch_claimed_at = NULL
        `,
        args: [locationId, weatherTimestamp, JSON.stringify(payload)],
    });

    return result.rowsAffected;
}

/**
 * Atomic compare-and-swap claim: succeeds (rowsAffected === 1) only if no
 * row exists yet for this location, or the existing claim is null/older
 * than claimTimeoutSeconds. Fails (rowsAffected === 0) if someone else's
 * claim is still active, meaning the caller lost the race and should not
 * also fetch.
 *
 * The inserted placeholder row (used only when no row exists yet) is
 * intentionally empty ('{}' payload) — it exists purely to hold the claim
 * until the winning caller's upsert() overwrites it with real data.
 */
async function claim(locationId, claimTimeoutSeconds) {
    const result = await db.execute({
        sql: `
            INSERT INTO weather_data (
                location_id,
                weather_timestamp,
                payload_json,
                fetched_at,
                fetch_claimed_at
            )
            VALUES (?, '', '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT(location_id) DO UPDATE SET
                fetch_claimed_at = CURRENT_TIMESTAMP
            WHERE weather_data.fetch_claimed_at IS NULL
               OR weather_data.fetch_claimed_at < datetime('now', ?)
        `,
        args: [locationId, `-${claimTimeoutSeconds} seconds`],
    });

    return result.rowsAffected === 1;
}

async function releaseClaim(locationId) {
    const result = await db.execute({
        sql: `
            UPDATE weather_data
            SET fetch_claimed_at = NULL
            WHERE location_id = ?
        `,
        args: [locationId],
    });

    return result.rowsAffected;
}

async function deleteByLocationId(locationId) {
    const result = await db.execute({
        sql: `
            DELETE FROM weather_data
            WHERE location_id = ?
        `,
        args: [locationId],
    });

    return result.rowsAffected;
}

export default {
    findByLocationId,
    findAllCachedLocationIds,
    upsert,
    claim,
    releaseClaim,
    deleteByLocationId,
};
