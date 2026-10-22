// ===================================================
// ファイル名: useDashboard.js
// 概要: ダッシュボード情報を取得・管理するカスタムフック
//       旧: 45秒ごとのポーリングだったものを廃止し、バックエンドが
//       配信する dashboard:layout-updated/module-added/module-removed/
//       module-updated を購読する方式に変更。
//       (ユーザー単位配信 — 同じユーザーの他タブ/他端末との同期用)
// ===================================================

import { useState, useEffect, useCallback, useRef } from "react";
import { useDashboardContext } from "./DashboardContext";
import dashboardService from "./dashboardService";
import { getSSEUrl } from "../../shared/sse/sseUrl";
import { useRealtime } from "../../shared/sse/RealtimeContext";
import { getMinSize, growToMinSize } from "../../common/ModuleHost/moduleSizes";
import { reflowModules } from "../../../../shared/utils/grid";

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
    const layoutRequestRef = useRef(0);
    const updateLayout = useCallback(async (key, value) => {
        setDashboard((prev) => {
            const layout = { ...prev.layout, [key]: value };
            if (key !== "columns" && key !== "rows") return { ...prev, layout };
            // Columns/rows change what every row-major cell index means, so
            // re-flow the modules locally in the same update — otherwise they
            // render at the wrong cells (overlapping) until the server replies.
            const result = reflowModules(
                prev.modules,
                prev.layout.columns,
                layout.columns,
                layout.rows,
            );
            return {
                ...prev,
                layout: { ...layout, rows: result.rows },
                modules: prev.modules.map((m, i) => ({
                    ...m,
                    cellIndex: result.modules[i].cellIndex,
                    layout: result.modules[i].layout,
                })),
            };
        });

        const requestId = (layoutRequestRef.current += 1);
        try {
            const state = await dashboardService.updateLayout({ [key]: value });
            // Slider drags fire many requests; only the newest response may win.
            if (requestId === layoutRequestRef.current && state?.modules) {
                setDashboard((prev) => ({ ...prev, layout: state.layout, modules: state.modules }));
            }
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
    const addModule = useCallback(async (type, settings = {}, layout) => {
        try {
            const module = await dashboardService.addModule(type, settings, layout);
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

    // =====================================================
    // Module size (cell-span)
    // =====================================================
    const updateModuleLayout = useCallback(async (moduleId, layout) => {
        try {
            const module = await dashboardService.updateModuleLayout(moduleId, layout);
            setDashboard((prev) => ({
                ...prev,
                modules: prev.modules.map((m) => (m.id === moduleId ? module : m)),
            }));
            return module;
        } catch (e) {
            console.error("[useDashboard] Failed to update module size:", e);
            throw e;
        }
    }, []);

    // =====================================================
    // Module position (top-left cell)
    // =====================================================
    const moveModule = useCallback(async (moduleId, cellIndex) => {
        try {
            const module = await dashboardService.moveModule(moduleId, cellIndex);
            setDashboard((prev) => ({
                ...prev,
                modules: prev.modules.map((m) => (m.id === moduleId ? module : m)),
            }));
            return module;
        } catch (e) {
            console.error("[useDashboard] Failed to move module:", e);
            throw e;
        }
    }, []);

    // A view-mode change calls this so the module is never left too small
    // for the view it just switched to. It only ever GROWS a module that's
    // below that view's minimum (see moduleSizes.js); a module already at
    // or above it keeps the user's chosen size untouched.
    const dashboardRef = useRef(dashboard);
    dashboardRef.current = dashboard;

    const ensureModuleMinSize = useCallback(
        async (moduleId, view) => {
            const { modules, layout } = dashboardRef.current;
            const module = modules.find((m) => m.id === moduleId);
            if (!module) return;

            const next = growToMinSize(
                module.layout,
                getMinSize(module.type, view),
                layout.columns,
                layout.rows,
            );
            if (!next) return;

            try {
                await updateModuleLayout(moduleId, next);
            } catch {
                // updateModuleLayout already logged it; the view change itself still applies.
            }
        },
        [updateModuleLayout],
    );

    return {
        dashboard,
        loading,
        updateLayout,
        updateDashboard,
        addModule,
        removeModule,
        updateModuleSettings,
        updateModuleLayout,
        moveModule,
        ensureModuleMinSize,
        selectedModuleId,
        selectModule,
        setDashboard,
    };
}

export function useDashboard() {
    return useDashboardContext();
}
