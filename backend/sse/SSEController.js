// ===================================================
// ファイル名: SSEController.js
// 概要: 中央SSEコントローラー — 単一の /api/sse 接続で全モジュールの
//       リアルタイム配信を扱う。
//       旧 announcements/schedule/themes/locations の各 *SyncService.js
//       (全クライアントへグローバル配信) と dashboardSyncService.js
//       (ユーザー単位配信) を統合したもの。
// ===================================================

const allClients = new Set(); // every connected res, for global broadcasts
const clientsByUser = new Map(); // userId -> Set<res>, for targeted broadcasts

/**
 * Registers a new SSE client connection. Called once per connected
 * browser tab from the /api/sse route.
 * @param {number|string} userId
 * @param {import('express').Response} res
 */
export function subscribe(userId, res) {
    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
    });
    res.write("retry: 5000\n\n");

    allClients.add(res);
    if (!clientsByUser.has(userId)) clientsByUser.set(userId, new Set());
    clientsByUser.get(userId).add(res);

    const heartbeat = setInterval(() => {
        try {
            res.write(": ping\n\n");
        } catch {
            clearInterval(heartbeat);
        }
    }, 25000);

    res.on("close", () => {
        clearInterval(heartbeat);
        allClients.delete(res);
        const bucket = clientsByUser.get(userId);
        if (!bucket) return;
        bucket.delete(res);
        if (bucket.size === 0) clientsByUser.delete(userId);
    });
}

function write(res, type, payload) {
    try {
        res.write(`event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`);
    } catch {
        allClients.delete(res);
    }
}

/**
 * Pushes an event to every connected client, regardless of user.
 * Use for data that isn't user-scoped (announcements, schedule, themes,
 * locations — shared/org-wide data in this app).
 * @param {string} type - namespaced event, e.g. "announcements:created"
 * @param {object} payload
 */
export function broadcast(type, payload) {
    for (const res of allClients) write(res, type, payload);
}

/**
 * Pushes an event only to a specific user's connected devices.
 * Use for per-user data (dashboard layout, user settings, etc).
 * @param {number|string} userId
 * @param {string} type
 * @param {object} payload
 */
export function broadcastToUser(userId, type, payload) {
    const bucket = clientsByUser.get(userId);
    if (!bucket) return;
    for (const res of bucket) write(res, type, payload);
}

/** Number of currently connected devices, total or for one user (debugging). */
export function connectionCount(userId) {
    return userId === undefined ? allClients.size : (clientsByUser.get(userId)?.size ?? 0);
}
