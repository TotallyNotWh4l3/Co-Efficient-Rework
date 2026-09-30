// ===================================================
// ファイル名: transitService.js
// 作成日: 2026/09/30
// 作成者: ゴンザガ　ウェイン
// 概要: 交通(駅・バス停)時刻表APIサービス
// ===================================================

import apiClient from "../../shared/api/apiClient";

/** 登録されている駅/バス停の一覧 (時刻データなし) */
export function getStops() {
    return apiClient.get("/transit/stops").then(({ data }) => data);
}

/** 1つの駅/バス停の全時刻表 */
export function getStop(id) {
    return apiClient.get(`/transit/stops/${encodeURIComponent(id)}`).then(({ data }) => data);
}
