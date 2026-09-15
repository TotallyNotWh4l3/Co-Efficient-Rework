
// ===================================================
// ファイル名: useScheduleTags.js
// 概要: スケジュールタグを管理するカスタムフック
//       旧: 45秒ごとのポーリングだったものを廃止し、バックエンドが
//       配信する schedule:tag-updated/tag-removed を購読する方式に変更。
// ===================================================

import { useCallback, useEffect, useState } from "react";
import scheduleService from "./scheduleService";
import { getSSEUrl } from "../../shared/sse/sseUrl";
import { useRealtime } from "../../shared/sse/RealtimeContext";

export default function useScheduleTags({ live = true } = {}) {
    const [tags, setTags] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const { subscribe } = useRealtime();

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

    useEffect(() => {
        if (!live) return undefined;

        const url = getSSEUrl();

        const unsubUpdated = subscribe(url, "schedule:tag-updated", (event) => {
            const tag = JSON.parse(event.data);
            setTags((prev) => {
                const exists = prev.some((t) => t.id === tag.id);
                return exists ? prev.map((t) => (t.id === tag.id ? tag : t)) : [...prev, tag];
            });
        });

        const unsubRemoved = subscribe(url, "schedule:tag-removed", (event) => {
            const { id } = JSON.parse(event.data);
            setTags((prev) => prev.filter((t) => t.id !== id));
        });

        return () => {
            unsubUpdated();
            unsubRemoved();
        };
    }, [live, subscribe]);

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
