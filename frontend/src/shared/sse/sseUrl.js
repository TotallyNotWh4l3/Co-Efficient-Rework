// ===================================================
// ファイル名: sseUrl.js
// 概要: 中央SSEエンドポイント (/api/sse) のURLを組み立てる共通ヘルパー
//       旧: 各サービスが個別に持っていた streamUrl() (.../<module>/stream)
//       の重複実装を統合。
// ===================================================

/**
 * Native EventSource can't send an Authorization header, so the token
 * travels as a query param instead — the backend's /api/sse route
 * verifies it manually. See backend/sse/sseRoutes.js.
 */
export function getSSEUrl() {
    const base = import.meta.env.VITE_API_URL || "http://192.168.200.105:3001/api";
    const token = localStorage.getItem("co-efficient-token") || "";
    return `${base}/sse?token=${encodeURIComponent(token)}`;
}
