
// ===================================================
// ファイル名: scheduleService.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: スケジュールAPIサービス
// ===================================================

import apiClient from "./apiClient";
import { getSSEUrl } from "../shared/sse/sseUrl";

const BASE = "/schedule";

const scheduleService = {
    getAll: () => apiClient.get(BASE).then((r) => r.data),
    getToday: () => apiClient.get(`${BASE}/today`).then((r) => r.data),
    getUpcoming: (limit) =>
        apiClient.get(`${BASE}/upcoming${limit ? `?limit=${limit}` : ""}`).then((r) => r.data),
    /** startIso/endIso: 'YYYY-MM-DD' — used by Relative view's rolling window. */
    getRange: (startIso, endIso) =>
        apiClient
            .get(
                `${BASE}/range?start=${encodeURIComponent(startIso)}&end=${encodeURIComponent(endIso)}`,
            )
            .then((r) => r.data),
    getSince: (sinceIso) =>
        apiClient.get(`${BASE}/sync?since=${encodeURIComponent(sinceIso)}`).then((r) => r.data),

    create: (payload) => apiClient.post(BASE, payload).then((r) => r.data),
    update: (id, payload) => apiClient.patch(`${BASE}/${id}`, payload).then((r) => r.data),
    remove: (id) => apiClient.delete(`${BASE}/${id}`).then((r) => r.data),

    // ---- Tags ----
    getTags: () => apiClient.get(`${BASE}/tags`).then((r) => r.data),
    upsertTag: (id, color) => apiClient.post(`${BASE}/tags`, { id, color }).then((r) => r.data),
    removeTag: (id) =>
        apiClient.delete(`${BASE}/tags/${encodeURIComponent(id)}`).then((r) => r.data),

    /**
     * Opens an SSE connection for real-time sync (create/update/delete + tag-updated/tag-removed).
     * Same token-as-query-param workaround as announcementService.openStream().
     */
    /** @deprecated use getSSEUrl() directly — kept for callers still using this shape. */
    streamUrl: getSSEUrl,
};

export default scheduleService;
