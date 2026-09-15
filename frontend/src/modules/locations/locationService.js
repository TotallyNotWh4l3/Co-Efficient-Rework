
// ===================================================
// ファイル名: locationService.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ロケーションAPIサービス
// ===================================================

import apiClient from "../../shared/api/apiClient";
import { getSSEUrl } from "../../shared/sse/sseUrl";

const BASE = "/locations";

const locationService = {
    getAll: () => apiClient.get(BASE).then((r) => r.data),
    create: (payload) => apiClient.post(BASE, payload).then((r) => r.data),
    update: (id, payload) => apiClient.patch(`${BASE}/${id}`, payload).then((r) => r.data),
    remove: (id) => apiClient.delete(`${BASE}/${id}`).then((r) => r.data),

    /**
     * Opens an SSE connection for real-time sync (location-created/updated/removed).
     * Same token-as-query-param pattern as scheduleService.openStream().
     */
    /** @deprecated use getSSEUrl() directly — kept for callers still using this shape. */
    streamUrl: getSSEUrl,
};

export default locationService;
