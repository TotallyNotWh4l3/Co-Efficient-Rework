
// ===================================================
// ファイル名: userService.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ユーザーAPIサービス
// ===================================================

import apiClient from "./apiClient";

function getAll() {
    return apiClient.get("/users").then((r) => r.data);
}

function create(payload) {
    return apiClient.post("/users", payload).then((r) => r.data);
}

function updateRole(id, role) {
    return apiClient.patch(`/users/${id}/role`, { role }).then((r) => r.data);
}

function updatePassword(id, password) {
    return apiClient.patch(`/users/${id}/password`, { password }).then((r) => r.data);
}

function remove(id) {
    return apiClient.delete(`/users/${id}`).then((r) => r.data);
}

export default {
    getAll,
    create,
    updateRole,
    updatePassword,
    remove,
};