
// ===================================================
// ファイル名: themeService.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: テーマAPIサービス
// ===================================================

import apiClient from "./apiClient";
import { getSSEUrl } from "../shared/sse/sseUrl";

const BASE = "/themes";

const themeService = {
    getAll: () => apiClient.get(BASE).then((r) => r.data),
    create: (payload) => apiClient.post(BASE, payload).then((r) => r.data),
    update: (id, payload) => apiClient.patch(`${BASE}/${id}`, payload).then((r) => r.data),
    remove: (id) => apiClient.delete(`${BASE}/${id}`).then((r) => r.data),
    /** @deprecated use getSSEUrl() directly — kept for callers still using this shape. */
    streamUrl: getSSEUrl,
};

export default themeService;
