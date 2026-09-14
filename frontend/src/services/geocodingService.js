// ===================================================
// ファイル名: geocodingService.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ジオコーディングAPIサービス
// ===================================================

import apiClient from "./apiClient";

const geocodingService = {
    search: (query) =>
        apiClient.get(`/geocoding/search?q=${encodeURIComponent(query)}`).then((r) => r.data),

    reverse: (latitude, longitude) =>
        apiClient.get(`/geocoding/reverse?lat=${latitude}&lon=${longitude}`).then((r) => r.data),
};

export default geocodingService;
