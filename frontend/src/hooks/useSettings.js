
// ===================================================
// ファイル名: useSettings.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 設定情報を取得・更新するカスタムフック
// ===================================================

import { useState, useEffect, useCallback, useRef } from "react";
import { useSettingsContext } from "../context/SettingsContext";
import * as SettingsService from "../services/settingsService";
import { DEFAULT_SETTINGS } from "../../../shared/constants/defaults/defaultSettings";

const SAVE_DEBOUNCE_MS = 500;

export function useSettingsState(user) {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const isInitialMount = useRef(true);
    const saveTimeoutRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem("co-efficient-token");
        const hasUser = user && (user.id || user._id || user.email || Object.keys(user).length > 0);
        if (!hasUser || !token) {
            setLoading(false);
            setSettings(null);
            return;
        }
        async function loadSettings() {
            try {
                setLoading(true);
                const data = await SettingsService.getSettings();
                setSettings(data);
            } catch (error) {
                console.error("[Settings] Failed to load.", error);
            } finally {
                setLoading(false);
            }
        }
        loadSettings();
    }, [user]);

    useEffect(() => {
        if (!settings) return;
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            SettingsService.saveSettings(settings).catch((error) =>
                console.error("[Settings] Save failed.", error),
            );
        }, SAVE_DEBOUNCE_MS);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [settings]);

    const updateSetting = useCallback((path, value) => {
        setSettings((previous) => {
            if (!previous) return previous;
            const updated = structuredClone(previous);
            const keys = path.split(".");
            let current = updated;
            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return updated;
        });
    }, []);

    const updatePreference = useCallback(
        (path, value) => {
            updateSetting(`preferences.${path}`, value);
        },
        [updateSetting],
    );

    const updateModuleDefault = useCallback(
        (module, key, value) => {
            updateSetting(`moduleDefaults.${module}.${key}`, value);
        },
        [updateSetting],
    );

    const applyTheme = useCallback(
        (themeId) => {
            updateSetting("preferences.appearance.currentTheme", themeId);
        },
        [updateSetting],
    );

    const applyLocation = useCallback(
        (locationId) => {
            updateSetting("preferences.locationId", locationId);
        },
        [updateSetting],
    );

    const saveLocation = useCallback((location) => {
        setSettings((previous) => ({
            ...previous,
            locations: [...previous.locations, location],
        }));
    }, []);

    const updateLocation = useCallback((id, updates) => {
        setSettings((previous) => ({
            ...previous,
            locations: previous.locations.map((location) =>
                location.id === id ? { ...location, ...updates } : location,
            ),
        }));
    }, []);

    const deleteLocation = useCallback((id) => {
        setSettings((previous) => ({
            ...previous,
            locations: previous.locations.filter((location) => location.id !== id),
            preferences:
                previous.preferences.locationId === id
                    ? {
                          ...previous.preferences,
                          preferences: {
                              ...previous.preferences.preferences,
                              locationId: "default-location",
                          },
                      }
                    : previous.preferences,
        }));
    }, []);

    const resetToDefaults = useCallback(() => {
        setSettings(structuredClone(DEFAULT_SETTINGS));
    }, []);

    const getSetting = useCallback(
        (path) => {
            if (!settings) return undefined;
            return path.split(".").reduce((object, key) => object?.[key], settings);
        },
        [settings],
    );

    return {
        settings,
        loading,
        updateSetting,
        updatePreference,
        updateModuleDefault,
        applyTheme,
        applyLocation,
        saveLocation,
        updateLocation,
        deleteLocation,
        resetToDefaults,
        getSetting,
    };
}

export function useSettings() {
    return useSettingsContext();
}
