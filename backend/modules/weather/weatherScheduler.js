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
import { getWeather } from "./weatherService.js";

const OFFSET_MINUTES = [1, 16, 31, 46];

function msUntilNextTick(now = new Date()) {
    const minutes = now.getMinutes();
    const next = OFFSET_MINUTES.find((m) => m > minutes) ?? OFFSET_MINUTES[0] + 60;

    const nextTick = new Date(now);
    nextTick.setSeconds(0, 0);
    nextTick.setMinutes(next % 60);
    if (next >= 60) nextTick.setHours(nextTick.getHours() + 1);

    return nextTick.getTime() - now.getTime();
}

async function refreshAllWatchedLocations() {
    const locationIds = await getAllCachedLocationIds();

    for (const locationId of locationIds) {
        try {
            const location = await Location.findById(locationId);
            if (!location) continue;

            // getWeather() itself decides freshness and only hits
            // Open-Meteo (and broadcasts) if the cached data is stale —
            // safe to call unconditionally here.
            await getWeather(location);
        } catch (error) {
            console.error(`[weatherScheduler] Failed to refresh ${locationId}:`, error.message);
        }
    }
}

let timer = null;

export function startWeatherScheduler() {
    const tick = async () => {
        await refreshAllWatchedLocations();
        timer = setTimeout(tick, msUntilNextTick());
    };

    timer = setTimeout(tick, msUntilNextTick());
    console.log("[weatherScheduler] Started.");
}

export function stopWeatherScheduler() {
    clearTimeout(timer);
}
