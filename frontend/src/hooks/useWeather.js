// ===================================================
// ファイル名: useWeather.js
// 概要: 天気情報を取得するカスタムフック
//       旧: XX:01/16/31/46 に自前でポーリングしていたのを廃止し、
//       サーバー側 weatherScheduler が同じタイミングで配信する
//       SSE "weather:updated" イベントを購読する方式に変更。
// ===================================================

import { useEffect, useState, useCallback } from "react";
import { getWeather } from "../services/weatherApi";
import { getSSEUrl } from "../shared/sse/sseUrl";
import { useRealtime } from "../context/RealtimeContext";

/**
 * @param {string} [locationId] — when provided, fetches weather for that
 * location specifically. When omitted, the backend falls back to the
 * user's saved preference (original behavior, unchanged).
 */
export default function useWeather(locationId) {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { subscribe } = useRealtime();

    const loadWeather = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getWeather(locationId);
            setWeather(data);
            setError(null);
        } catch (error) {
            console.error(error);
            // Keep showing the last-known weather rather than clearing it —
            // a transient failure shouldn't blank the module — but surface
            // the error so it's visible that the data on screen may be stale.
            setError(error);
        } finally {
            setLoading(false);
        }
    }, [locationId]);

    // One-time initial load. After this, updates arrive via SSE — the
    // backend's weatherScheduler refreshes every watched location on the
    // XX:01/16/31/46 cadence and pushes the result to everyone, so no
    // per-tab polling loop is needed here anymore.
    useEffect(() => {
        loadWeather();
    }, [loadWeather]);

    useEffect(() => {
        const unsubscribe = subscribe(getSSEUrl(), "weather:updated", (event) => {
            const { locationId: updatedLocationId, weather: updatedWeather } = JSON.parse(
                event.data,
            );

            // With no explicit locationId requested, this hook is showing
            // whatever the backend picked as the user's default — we can't
            // know which location that resolved to, so just accept any
            // update. With an explicit locationId, only apply matching ones.
            if (!locationId || updatedLocationId === locationId) {
                setWeather(updatedWeather);
                setError(null);
            }
        });

        return unsubscribe;
    }, [locationId, subscribe]);

    return {
        weather,
        loading,
        error,
        refresh: loadWeather,
    };
}
