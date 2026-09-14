// ===================================================
// ファイル名: useDashboard.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ダッシュボード情報を取得・管理するカスタムフック
// ===================================================

import { useState, useEffect, useCallback } from "react";
import { useDashboardContext } from "../context/DashboardContext";
import dashboardService from "../services/dashboardService";

const EMPTY_DASHBOARD = {
    id: "main",
    name: "Main Dashboard",
    layout: { columns: 3, gap: 16, padding: 16 },
    modules: [],
};

const POLL_INTERVAL_MS = 45000;

/**
 * useDashboard Hook
 *
 * Each user's dashboard lives server-side (not localStorage), so it follows
 * them across devices/browsers. Live sync now polls the server on an
 * interval rather than holding an SSE connection open — the previous SSE
 * setup was causing the free-tier backend host to degrade under sustained
 * load from multiple long-lived connections.
 */
export function useDashboardState(user) {
    const userId = user?.id ?? user?._id ?? null;
    const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
    const [loading, setLoading] = useState(true);
    const [selectedModuleId, setSelectedModuleId] = useState(null);

    const load = useCallback(async ({ silent = false } = {}) => {
        if (!silent) setLoading(true);
        try {
            const state = await dashboardService.getState();
            setDashboard(state);
        } catch (e) {
            console.error("[useDashboard] Failed to load dashboard:", e);
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    // =====================================================
    // Load (and reload whenever the logged-in user changes)
    // =====================================================
    useEffect(() => {
        if (!userId) {
            setDashboard(EMPTY_DASHBOARD);
            setLoading(false);
            return undefined;
        }
        let cancelled = false;
        setLoading(true);
        dashboardService
            .getState()
            .then((state) => {
                if (!cancelled) setDashboard(state);
            })
            .catch((e) => {
                console.error("[useDashboard] Failed to load dashboard:", e);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        setSelectedModuleId(null);
        return () => {
            cancelled = true;
        };
    }, [userId]);

    // =====================================================
    // Live sync via polling — re-fetches the whole dashboard
    // state on an interval instead of listening for individual
    // module/layout events over SSE.
    // =====================================================
    useEffect(() => {
        if (!userId) return undefined;

        const interval = setInterval(() => {
            load({ silent: true });
        }, POLL_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [userId, load]);

    // =====================================================
    // Layout
    // =====================================================
    const updateLayout = useCallback(async (key, value) => {
        setDashboard((prev) => ({ ...prev, layout: { ...prev.layout, [key]: value } }));
        try {
            await dashboardService.updateLayout({ [key]: value });
        } catch (e) {
            console.error("[useDashboard] Failed to update layout:", e);
        }
    }, []);

    // =====================================================
    // Local-only override — does NOT persist to the server.
    // Kept for API-compatibility with existing call sites.
    // =====================================================
    const updateDashboard = useCallback((updater) => {
        setDashboard((prev) => (typeof updater === "function" ? updater(prev) : updater));
    }, []);

    // =====================================================
    // Modules
    // =====================================================
    const addModule = useCallback(async (type, settings = {}) => {
        try {
            const module = await dashboardService.addModule(type, settings);
            setDashboard((prev) => {
                if (prev.modules.some((m) => m.id === module.id)) return prev;
                return { ...prev, modules: [...prev.modules, module] };
            });
            return module;
        } catch (e) {
            console.error("[useDashboard] Failed to add module:", e);
            throw e;
        }
    }, []);

    const removeModule = useCallback(async (moduleId) => {
        setDashboard((prev) => ({
            ...prev,
            modules: prev.modules.filter((module) => module.id !== moduleId),
        }));
        try {
            await dashboardService.removeModule(moduleId);
        } catch (e) {
            console.error("[useDashboard] Failed to remove module:", e);
        }
    }, []);

    const updateModuleSettings = useCallback(async (moduleId, key, value) => {
        setDashboard((prev) => ({
            ...prev,
            modules: prev.modules.map((module) =>
                module.id === moduleId
                    ? { ...module, settings: { ...module.settings, [key]: value } }
                    : module,
            ),
        }));
        try {
            await dashboardService.updateModuleSettings(moduleId, key, value);
        } catch (e) {
            console.error("[useDashboard] Failed to update module settings:", e);
        }
    }, []);

    const selectModule = useCallback((moduleId) => {
        setSelectedModuleId(moduleId);
    }, []);

    return {
        dashboard,
        loading,
        updateLayout,
        updateDashboard,
        addModule,
        removeModule,
        updateModuleSettings,
        selectedModuleId,
        selectModule,
        setDashboard,
    };
}

export function useDashboard() {
    return useDashboardContext();
}
