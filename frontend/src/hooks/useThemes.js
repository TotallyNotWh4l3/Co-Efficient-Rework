
// ===================================================
// ファイル名: useThemes.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: テーマ情報を取得するカスタムフック
// ===================================================

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import themeService from "../services/themeService";

const POLL_INTERVAL_MS = 45000;

export function useThemes({ live = true } = {}) {
    const { user } = useAuth();

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

    // Polling replaces the old SSE-based live sync (removed to avoid holding
    // long-lived connections open on free-tier hosting).
    useEffect(() => {
        if (!live || !user) return undefined;

        const interval = setInterval(() => {
            load({ silent: true });
        }, POLL_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [live, user, load]);

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
