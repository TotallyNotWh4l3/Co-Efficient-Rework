// ===================================================
// ファイル名: announcementService.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: お知らせAPIサービス
// ===================================================

import apiClient from "../../shared/api/apiClient";
import { getSSEUrl } from "../../shared/sse/sseUrl";

const BASE = "/announcements";

const announcementService = {
    getRecent: () => apiClient.get(`${BASE}/recent`).then((r) => r.data),
    getAll: () => apiClient.get(BASE).then((r) => r.data),
    getArchived: () => apiClient.get(`${BASE}/archive`).then((r) => r.data),
    getSince: (sinceIso) =>
        apiClient.get(`${BASE}/sync?since=${encodeURIComponent(sinceIso)}`).then((r) => r.data),
    getLogs: (id) => apiClient.get(`${BASE}/${id}/logs`).then((r) => r.data),

    create: (payload) => apiClient.post(BASE, payload).then((r) => r.data),
    update: (id, payload) => apiClient.patch(`${BASE}/${id}`, payload).then((r) => r.data),
    remove: (id) => apiClient.delete(`${BASE}/${id}`).then((r) => r.data),
    archive: (id) => apiClient.post(`${BASE}/${id}/archive`).then((r) => r.data),
    restore: (id) => apiClient.post(`${BASE}/${id}/restore`).then((r) => r.data),
    markRead: (id) => apiClient.post(`${BASE}/${id}/read`).then((r) => r.data),
    getUnreadCount: () => apiClient.get(`${BASE}/unread-count`).then((r) => r.data),

    /**
     * Opens an SSE connection for real-time sync (create/update/delete/archive/restore).
     * Native EventSource can't send Authorization headers, so the token travels
     * as a query param instead — the backend's authenticateStream() middleware
     * expects this. Returns an EventSource; caller closes it on unmount.
     */
    /** @deprecated use getSSEUrl() directly — kept for callers still using this shape. */
    streamUrl: getSSEUrl,
};

export default announcementService;