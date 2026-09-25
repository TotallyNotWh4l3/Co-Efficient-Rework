// ===================================================
// ファイル名: weatherScheduler.js
// 概要: 天気情報の定期更新スケジューラー
//       旧: フロントエンドの useWeather.js が各タブごとに
//       XX:01 / XX:16 / XX:31 / XX:46 でポーリングしていたのを、
//       サーバー側で一度だけ取得し、SSE で全クライアントへ配信するよう
//       に置き換えたもの。
// ===================================================

import Location from "../locations/Location.js";
import { getAllCachedLocationIds } from "./weatherDataStore.js";
import { getWeather, isWeatherCurrent } from "./weatherService.js";

const OFFSET_MINUTES = [1, 16, 31, 46];

// Open-Meteo sometimes hasn't published the new 15-min interval at XX:01.
// Instead of waiting for the next tick (=> 15 min of stale data), retry the
// still-stale locations every minute until the next tick takes over.
const RETRY_MS = 60_000;
const MAX_RETRIES = 10;

function msUntilNextTick(now = new Date()) {
    const minutes = now.getMinutes();
    const next = OFFSET_MINUTES.find((m) => m > minutes) ?? OFFSET_MINUTES[0] + 60;

    const nextTick = new Date(now);
    nextTick.setSeconds(0, 0);
    nextTick.setMinutes(next % 60);
    if (next >= 60) nextTick.setHours(nextTick.getHours() + 1);

    return nextTick.getTime() - now.getTime();
}

async function refreshLocations(locationIds) {
    const stillStale = [];

    for (const locationId of locationIds) {
        try {
            const location = await Location.findById(locationId);
            if (!location) continue;

            // getWeather() decides freshness from the data's own timestamp
            // and only hits Open-Meteo (and broadcasts) if it's behind.
            await getWeather(location);

            if (!(await isWeatherCurrent(locationId))) stillStale.push(locationId);
        } catch (error) {
            console.error(`[weatherScheduler] Failed to refresh ${locationId}:`, error.message);
            stillStale.push(locationId);
        }
    }

    return stillStale;
}

let timer = null;
let retryTimer = null;

function scheduleRetry(locationIds, attempt) {
    if (locationIds.length === 0 || attempt > MAX_RETRIES) return;

    retryTimer = setTimeout(async () => {
        const stale = await refreshLocations(locationIds);
        scheduleRetry(stale, attempt + 1);
    }, RETRY_MS);
}

export function startWeatherScheduler() {
    const tick = async () => {
        clearTimeout(retryTimer);

        const stale = await refreshLocations(await getAllCachedLocationIds());
        scheduleRetry(stale, 1);

        timer = setTimeout(tick, msUntilNextTick());
    };

    timer = setTimeout(tick, msUntilNextTick());
    console.log("[weatherScheduler] Started.");
}

export function stopWeatherScheduler() {
    clearTimeout(timer);
    clearTimeout(retryTimer);
}
