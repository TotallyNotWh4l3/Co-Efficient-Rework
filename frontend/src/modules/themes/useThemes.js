
// ===================================================
// ファイル名: useThemes.js
// 概要: テーマ情報を取得するカスタムフック
//       旧: 45秒ごとのポーリングだったものを廃止し、バックエンドが
//       配信する themes:theme-created/theme-updated/theme-removed を
//       購読する方式に変更。
// ===================================================

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import themeService from "./themeService";
import { getSSEUrl } from "../../shared/sse/sseUrl";
import { useRealtime } from "../../shared/sse/RealtimeContext";

export function useThemes({ live = true } = {}) {
    const { user } = useAuth();
    const { subscribe } = useRealtime();

    const [themes, setThemes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(async ({ silent = false } = {}) => {
        setLoading(true);
        setError(null);
        try {
            const data = await themeService.getAll();
            setThemes(Array.isArray(data) ? data : []);
        } catch (e) {
            setError(e.message || "Failed to load themes.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!user) {
            setThemes([]);
            setLoading(false);
            return;
        }
        load();
    }, [user, load]);

    useEffect(() => {
        if (!live || !user) return undefined;

        const url = getSSEUrl();

        const unsubCreated = subscribe(url, "themes:theme-created", (event) => {
            const created = JSON.parse(event.data);
            setThemes((prev) => {
                const exists = prev.some((t) => t.id === created.id);
                return exists
                    ? prev.map((t) => (t.id === created.id ? created : t))
                    : [...prev, created];
            });
        });

        const unsubUpdated = subscribe(url, "themes:theme-updated", (event) => {
            const updated = JSON.parse(event.data);
            setThemes((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        });

        const unsubRemoved = subscribe(url, "themes:theme-removed", (event) => {
            const { id } = JSON.parse(event.data);
            setThemes((prev) => prev.filter((t) => t.id !== id));
        });

        return () => {
            unsubCreated();
            unsubUpdated();
            unsubRemoved();
        };
    }, [live, user, subscribe]);

    const createTheme = useCallback(async (payload) => {
        const created = await themeService.create(payload);
        setThemes((prev) => {
            const exists = prev.some((t) => t.id === created.id);
            return exists
                ? prev.map((t) => (t.id === created.id ? created : t))
                : [...prev, created];
        });
        return created;
    }, []);

    const updateTheme = useCallback(async (id, updates) => {
        const updated = await themeService.update(id, updates);
        setThemes((prev) => prev.map((t) => (t.id === id ? updated : t)));
        return updated;
    }, []);

    const deleteTheme = useCallback(async (id) => {
        await themeService.remove(id);
        setThemes((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return { themes, loading, error, reload: load, createTheme, updateTheme, deleteTheme };
}
