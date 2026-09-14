
// ===================================================
// ファイル名: useScheduleTags.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: スケジュールタグを管理するカスタムフック
// ===================================================

import { useCallback, useEffect, useState } from "react";
import scheduleService from "../services/scheduleService";

const POLL_INTERVAL_MS = 45000;

export default function useScheduleTags({ live = true } = {}) {
    const [tags, setTags] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(async ({ silent = false } = {}) => {
        if (!silent) setIsLoading(true);
        setError(null);
        try {
            const data = await scheduleService.getTags();
            setTags(Array.isArray(data) ? data : []);
        } catch (e) {
            setError(e.message || "Failed to load tags.");
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    // Polling replaces the old SSE-based live sync (removed to avoid holding
    // long-lived connections open on free-tier hosting).
    useEffect(() => {
        if (!live) return undefined;

        const interval = setInterval(() => {
            load({ silent: true });
        }, POLL_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [live, load]);

    const upsertTag = useCallback(async (id, color) => {
        const tag = await scheduleService.upsertTag(id, color);
        setTags((prev) => {
            const exists = prev.some((t) => t.id === tag.id);
            return exists ? prev.map((t) => (t.id === tag.id ? tag : t)) : [...prev, tag];
        });
        return tag;
    }, []);

    const removeTag = useCallback(async (id) => {
        await scheduleService.removeTag(id);
        setTags((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return { tags, isLoading, error, reload: load, upsertTag, removeTag };
}
