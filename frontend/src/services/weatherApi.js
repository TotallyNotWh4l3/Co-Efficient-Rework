// ===================================================
// ファイル名: weatherApi.js
// 概要: 天気APIサービス
//       旧: Vercelのコールドスタート対策だった指数バックオフの
//       リトライキューは、フルローカル運用になったため不要となり削除。
// ===================================================

import apiClient from "./apiClient";

/**
 * Fetches weather for the user's saved location preference by default.
 * Pass a locationId to fetch weather for a specific location instead.
 */
export function getWeather(locationId) {
    return apiClient
        .get("/weather", { params: locationId ? { locationId } : undefined })
        .then(({ data }) => data);
}
