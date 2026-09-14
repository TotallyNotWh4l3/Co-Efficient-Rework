
// ===================================================
// ファイル名: authService.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 認証APIサービス
// ===================================================

import API from "./apiClient";

export async function login(username, password) {
    const { data } = await API.post("/auth/login", {
        username,
        password,
    });

    return data;
}

export async function getCurrentUser() {
    const { data } = await API.get("/auth/me");

    return data;
}
