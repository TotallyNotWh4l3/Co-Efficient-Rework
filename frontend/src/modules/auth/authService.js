
// ===================================================
// ファイル名: authService.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 認証APIサービス
// ===================================================

import API from "../../shared/api/apiClient";

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

// ---- DEV quick-login (backend answers 404 unless DEV_QUICK_LOGIN=true) ----

// Resolves to the list of accounts when quick-login is enabled on the
// backend, or null when it isn't (or the backend is unreachable) — the
// login screen uses null to hide the whole dev panel.
export async function getDevUsers() {
    try {
        const { data } = await API.get("/auth/dev/users");
        return data;
    } catch {
        return null;
    }
}

// target: { userId } or { role: "admin" }
export async function devLogin(target) {
    const { data } = await API.post("/auth/dev/login", target);

    return data;
}
