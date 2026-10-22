// ===================================================
// ファイル名: useTransit.js
// 作成日: 2026/09/30
// 作成者: ゴンザガ　ウェイン
// 概要: 駅/バス停の一覧と、選択中の駅/バス停の時刻表を取得するフック。
// ===================================================

import { useCallback, useEffect, useState } from "react";
import { getStop, getStops } from "./transitService";

export default function useTransit(stopId) {
    const [stops, setStops] = useState([]);
    const [stop, setStop] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stopMissing, setStopMissing] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    const reload = useCallback(() => setReloadKey((k) => k + 1), []);

    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        setError(null);
        setStopMissing(false);

        (async () => {
            try {
                const list = await getStops();
                if (cancelled) return;
                setStops(list);

                if (!stopId) {
                    setStop(null);
                    return;
                }
                try {
                    const detail = await getStop(stopId);
                    if (!cancelled) setStop(detail);
                } catch (err) {
                    if (cancelled) return;
                    // JSON ファイルが削除された/id が変わった場合
                    if (err.response?.status === 404) {
                        setStop(null);
                        setStopMissing(true);
                    } else {
                        throw err;
                    }
                }
            } catch (err) {
                if (!cancelled) {
                    console.error("[useTransit] Load failed:", err);
                    setError(err.response?.data?.message ?? err.message ?? "Error");
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [stopId, reloadKey]);

    return { stops, stop, isLoading, error, stopMissing, reload };
}
