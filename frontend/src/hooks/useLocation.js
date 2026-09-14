
// ===================================================
// ファイル名: useLocation.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ロケーション情報を取得・管理するカスタムフック
// ===================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSettings } from "./useSettings";
import { useAuth } from "./useAuth";
import locationService from "../services/locationService";

const POLL_INTERVAL_MS = 45000;

export function useLocation({ live = true } = {}) {
    const { settings, loading: settingsLoading } = useSettings();
    const { user } = useAuth();

    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(async ({ silent = false } = {}) => {
        if (!silent) setLoading(true);
        setError(null);
        try {
            const data = await locationService.getAll();
            setLocations(Array.isArray(data) ? data : []);
        } catch (e) {
            setError(e.message || "Failed to load locations.");
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!user) {
            setLocations([]);
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

    const currentLocation = useMemo(() => {
        if (!settings) return null;
        return locations.find((l) => l.id === settings.preferences.locationId) ?? null;
    }, [locations, settings]);

    const locationOptions = useMemo(
        () => locations.map((l) => ({ id: l.id, label: l.name })),
        [locations],
    );

    const requestCurrentLocation = useCallback(() => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Geolocation is not supported."));
                return;
            }
            navigator.geolocation.getCurrentPosition(
                ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
                reject,
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
            );
        });
    }, []);

    const createLocation = useCallback(async (payload) => {
        const created = await locationService.create(payload);
        setLocations((prev) => {
            const exists = prev.some((l) => l.id === created.id);
            return exists
                ? prev.map((l) => (l.id === created.id ? created : l))
                : [...prev, created];
        });
        return created;
    }, []);

    const updateLocation = useCallback(async (id, updates) => {
        const updated = await locationService.update(id, updates);
        setLocations((prev) => prev.map((l) => (l.id === id ? updated : l)));
        return updated;
    }, []);

    const deleteLocation = useCallback(async (id) => {
        await locationService.remove(id);
        setLocations((prev) => prev.filter((l) => l.id !== id));
    }, []);

    return {
        loading: loading || settingsLoading,
        error,
        locations,
        currentLocation,
        locationOptions,
        requestCurrentLocation,
        createLocation,
        updateLocation,
        deleteLocation,
        reload: load,
    };
}
