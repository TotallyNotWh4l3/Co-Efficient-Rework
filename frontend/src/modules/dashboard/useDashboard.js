// ===================================================
// ファイル名: useDashboard.js
// 概要: ダッシュボード情報を取得・管理するカスタムフック
//       旧: 45秒ごとのポーリングだったものを廃止し、バックエンドが
//       配信する dashboard:layout-updated/module-added/module-removed/
//       module-updated を購読する方式に変更。
//       (ユーザー単位配信 — 同じユーザーの他タブ/他端末との同期用)
// ===================================================

import { useState, useEffect, useCallback } from "react";
import { useDashboardContext } from "./DashboardContext";
import dashboardService from "./dashboardService";
import { getSSEUrl } from "../../shared/sse/sseUrl";
import { useRealtime } from "../../shared/sse/RealtimeContext";

const EMPTY_DASHBOARD = {
    id: "main",
    name: "Main Dashboard",
    layout: { columns: 3, rows: 4, gap: 16, padding: 16 },
    modules: [],
};

/**
 * useDashboard Hook
 *
 * Each user's dashboard lives server-side (not localStorage), so it follows
 * them across devices/browsers. Live sync is via SSE — the backend
 * broadcasts layout/module changes to that user's other connected tabs
 * over the central /api/sse channel.
 */
export function useDashboardState(user) {
    const userId = user?.id ?? user?._id ?? null;
    const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
    const [loading, setLoading] = useState(true);
    const [selectedModuleId, setSelectedModuleId] = useState(null);
    const { subscribe } = useRealtime();

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
    // Live sync via SSE — applies layout/module changes pushed
    // from this same user's other connected tabs/devices.
    // =====================================================
    useEffect(() => {
        if (!userId) return undefined;

        const url = getSSEUrl();

        const unsubLayout = subscribe(url, "dashboard:layout-updated", (event) => {
            const layout = JSON.parse(event.data);
            setDashboard((prev) => ({ ...prev, layout: { ...prev.layout, ...layout } }));
        });

        const unsubAdded = subscribe(url, "dashboard:module-added", (event) => {
            const module = JSON.parse(event.data);
            setDashboard((prev) => {
                if (prev.modules.some((m) => m.id === module.id)) return prev;
                return { ...prev, modules: [...prev.modules, module] };
            });
        });

        const unsubRemoved = subscribe(url, "dashboard:module-removed", (event) => {
            const { id } = JSON.parse(event.data);
            setDashboard((prev) => ({
                ...prev,
                modules: prev.modules.filter((module) => module.id !== id),
            }));
        });

        const unsubUpdated = subscribe(url, "dashboard:module-updated", (event) => {
            const updatedModule = JSON.parse(event.data);
            setDashboard((prev) => ({
                ...prev,
                modules: prev.modules.map((module) =>
                    module.id === updatedModule.id ? updatedModule : module,
                ),
            }));
        });

        return () => {
            unsubLayout();
            unsubAdded();
            unsubRemoved();
            unsubUpdated();
        };
    }, [userId, subscribe]);

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
