// ===================================================
// ファイル名: weatherDataStore.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 天気情報データストア
// ===================================================

import WeatherData from "./WeatherData.js";

/**
 * Open-Meteo updates around:
 *
 * XX:00
 * XX:15
 * XX:30
 * XX:45
 *
 * We intentionally refresh at:
 *
 * XX:01
 * XX:16
 * XX:31
 * XX:46
 */
export function getLatestWeatherTimestamp(now = new Date()) {
    const latest = new Date(now);

    latest.setSeconds(0);
    latest.setMilliseconds(0);

    const minute = latest.getMinutes();

    if (minute >= 46) {
        latest.setMinutes(45);
    } else if (minute >= 31) {
        latest.setMinutes(30);
    } else if (minute >= 16) {
        latest.setMinutes(15);
    } else if (minute >= 1) {
        latest.setMinutes(0);
    } else {
        latest.setHours(latest.getHours() - 1);
        latest.setMinutes(45);
    }

    return latest.toISOString();
}

// Returns the raw cache row (or null) with no freshness judgement made here —
// callers decide staleness themselves off the payload's own data (e.g.
// payload._dataTimestampUtc), since that's what actually reflects how
// current the weather data is, as opposed to when it happened to be stored.
export async function getCachedWeatherRow(locationId) {
    return WeatherData.findByLocationId(locationId);
}

export async function getAllCachedLocationIds() {
    return WeatherData.findAllCachedLocationIds();
}

export async function setCachedWeather(locationId, weatherTimestamp, data) {
    return WeatherData.upsert(locationId, weatherTimestamp, data);
}

export async function clearCachedWeather(locationId) {
    return WeatherData.deleteByLocationId(locationId);
}

// Cross-instance lock: attempts to atomically claim the right to refetch
// this location. Only one concurrent caller (across however many separate
// Vercel serverless instances happen to be handling requests at once) can
// win — everyone else should fall back to serving the existing cached
// payload rather than also hitting Open-Meteo. The claim auto-expires
// after claimTimeoutSeconds so a caller that crashes or times out mid-fetch
// can't permanently block future refreshes for that location.
export async function claimFetch(locationId, claimTimeoutSeconds = 8) {
    return WeatherData.claim(locationId, claimTimeoutSeconds);
}

export async function releaseFetchClaim(locationId) {
    return WeatherData.releaseClaim(locationId);
}
