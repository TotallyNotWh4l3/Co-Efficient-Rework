
// ===================================================
// ファイル名: dashboardService.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ダッシュボードAPIサービス
// ===================================================

import apiClient from "../../shared/api/apiClient";
import { getSSEUrl } from "../../shared/sse/sseUrl";

const BASE = "/dashboard";

const dashboardService = {
    getState: () => apiClient.get(BASE).then((r) => r.data),
    updateLayout: (updates) => apiClient.patch(`${BASE}/layout`, updates).then((r) => r.data),
    addModule: (type, settings) =>
        apiClient.post(`${BASE}/modules`, { type, settings }).then((r) => r.data),
    removeModule: (id) => apiClient.delete(`${BASE}/modules/${id}`).then((r) => r.data),
    updateModuleSettings: (id, key, value) =>
        apiClient.patch(`${BASE}/modules/${id}/settings`, { key, value }).then((r) => r.data),
    /** @deprecated use getSSEUrl() directly — kept for callers still using this shape. */
    streamUrl: getSSEUrl,
};

export default dashboardService;
