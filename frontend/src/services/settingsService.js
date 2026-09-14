
// ===================================================
// ファイル名: settingsService.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 設定APIサービス
// ===================================================

import apiClient from "./apiClient";

export async function getSettings() {
    const { data } = await apiClient.get("/settings");
    return data;
}

export async function saveSettings(settings) {
    const { data } = await apiClient.put("/settings", settings);
    return data;
}