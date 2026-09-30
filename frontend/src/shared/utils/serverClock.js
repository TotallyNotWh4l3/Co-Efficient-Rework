// ===================================================
// ファイル名: serverClock.js
// 概要: サーバー時刻との差を測って補正する時計。
//       端末(学校のPCなど)の時計が数分ずれていても、表示はサーバー基準の
//       正しい時刻になる。サーバーに時刻を問い合わせ、往復時間の中間点で
//       ずれ(offset)を計算する。取得に失敗した場合は端末の時計にそのまま戻る。
// ===================================================

import apiClient from "../api/apiClient";

const RESYNC_MS = 5 * 60 * 1000; // drift and OS clock corrections are re-measured regularly
const SAMPLES = 3; // take a few, keep the one with the shortest round trip (most accurate)
const NOTIFY_THRESHOLD_MS = 100; // ignore jitter below this so nothing re-renders for noise

let offsetMs = 0; // server time minus device time
let started = false;
let syncing = false;
const listeners = new Set();

/** Current time according to the server, as a Date. */
export function getServerNow() {
    return new Date(Date.now() + offsetMs);
}

export function getServerOffsetMs() {
    return offsetMs;
}

/** Called whenever a sync changes the offset noticeably. Returns an unsubscribe function. */
export function subscribeServerClock(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

async function sampleOnce() {
    const p0 = performance.now();
    const res = await apiClient.get("/time", { timeout: 4000 });
    const rtt = performance.now() - p0;

    const serverNow = Number(res.data?.now);
    if (!Number.isFinite(serverNow)) throw new Error("Invalid /time payload");

    // The server stamped its time about halfway through the round trip.
    const deviceAtStamp = Date.now() - rtt / 2;
    return { rtt, offset: serverNow - deviceAtStamp };
}

export async function syncServerClock() {
    if (syncing) return;
    syncing = true;
    try {
        let best = null;
        for (let i = 0; i < SAMPLES; i++) {
            try {
                const sample = await sampleOnce();
                if (!best || sample.rtt < best.rtt) best = sample;
            } catch {
                // Skip a failed sample; if all fail we simply keep the last known offset.
            }
        }
        if (best) {
            const changed = Math.abs(best.offset - offsetMs) > NOTIFY_THRESHOLD_MS;
            offsetMs = best.offset;
            if (changed) listeners.forEach((fn) => fn());
        }
    } finally {
        syncing = false;
    }
}

/** Idempotent: starts the initial sync plus periodic / on-wake re-syncs once per page. */
export function startServerClockSync() {
    if (started) return;
    started = true;
    syncServerClock();
    setInterval(syncServerClock, RESYNC_MS);
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") syncServerClock();
    });
    window.addEventListener("online", syncServerClock);
}
