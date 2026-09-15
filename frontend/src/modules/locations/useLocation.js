
// ===================================================
// ファイル名: useLocation.js
// 概要: ロケーション情報を取得・管理するカスタムフック
//       旧: 45秒ごとのポーリングだったものを廃止し、バックエンドが
//       配信する locations:location-created/updated/removed を
//       購読する方式に変更。
// ===================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSettings } from "../settings/useSettings";
import { useAuth } from "../auth/useAuth";
import locationService from "./locationService";
import { getSSEUrl } from "../../shared/sse/sseUrl";
import { useRealtime } from "../../shared/sse/RealtimeContext";

export function useLocation({ live = true } = {}) {
    const { settings, loading: settingsLoading } = useSettings();
    const { user } = useAuth();
    const { subscribe } = useRealtime();

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

    useEffect(() => {
        if (!live || !user) return undefined;

        const url = getSSEUrl();

        const unsubCreated = subscribe(url, "locations:location-created", (event) => {
            const created = JSON.parse(event.data);
            setLocations((prev) => {
                const exists = prev.some((l) => l.id === created.id);
                return exists
                    ? prev.map((l) => (l.id === created.id ? created : l))
                    : [...prev, created];
            });
        });

        const unsubUpdated = subscribe(url, "locations:location-updated", (event) => {
            const updated = JSON.parse(event.data);
            setLocations((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
        });

        const unsubRemoved = subscribe(url, "locations:location-removed", (event) => {
            const { id } = JSON.parse(event.data);
            setLocations((prev) => prev.filter((l) => l.id !== id));
        });

        return () => {
            unsubCreated();
            unsubUpdated();
            unsubRemoved();
        };
    }, [live, user, subscribe]);

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
