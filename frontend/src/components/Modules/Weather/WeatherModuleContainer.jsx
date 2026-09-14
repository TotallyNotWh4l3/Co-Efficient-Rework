// ===================================================
// ファイル名: WeatherModuleContainer.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 天気モジュール コンテナ コンポーネント
// ===================================================

import React, { useState, useEffect } from "react";
import WeatherModule from "./WeatherModule";
import useWeather from "../../../hooks/useWeather";
import { useLocation } from "../../../hooks/useLocation";
import { useDashboard } from "../../../hooks/useDashboard";
import { useSettings } from "../../../hooks/useSettings";
import { useAuth } from "../../../hooks/useAuth";
import { mapWeatherResponse } from "./utils/mapWeatherResponse";
import "./weather.css";
import { useLanguage } from "../../../hooks/useLanguage";
// ...

/**
 * Data-wiring layer for the weather module.
 *
 * Matches the same contract every other module gets from ModuleRenderer:
 * only a `module` object is passed in. Everything else — language, user
 * role, this card's chosen location, layout mode — is derived internally.
 *
 * `module` shape (see defaultDashboard.js):
 * {
 *   id, type: 'weather',
 *   settings: { title, location: <locationId>, view: <layoutMode> },
 *   layout: { w, h },
 * }
 */
export default function WeatherModuleContainer({ module }) {
    const { locationOptions } = useLocation();
    const { removeModule, updateModuleSettings } = useDashboard();
    const { settings } = useSettings();
    const { user } = useAuth();

    const isJapanese = settings?.preferences?.language === "ja";
    const userRole = user?.role;

    const [selectedLocationId, setSelectedLocationId] = useState(module.settings?.location);
    const lang = useLanguage();
    const t = lang.modules.weather.current;

    useEffect(() => {
        if (module.settings?.location && module.settings.location !== selectedLocationId) {
            setSelectedLocationId(module.settings.location);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [module.settings?.location]);

    useEffect(() => {
        if (selectedLocationId) return;
        if (locationOptions.length === 0) return;

        const fallbackId = settings?.preferences?.locationId ?? locationOptions[0].id;

        setSelectedLocationId(fallbackId);
        updateModuleSettings(module.id, "location", fallbackId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedLocationId, locationOptions, settings?.preferences?.locationId]);

    const { weather, loading, error, refresh } = useWeather(selectedLocationId);

    const handleLocationChange = (id) => {
        setSelectedLocationId(id);
        updateModuleSettings(module.id, "location", id);
    };

    const handleLayoutModeChange = (mode) => {
        updateModuleSettings(module.id, "view", mode);
    };

    const handleRemove = () => {
        removeModule(module.id);
    };

    if (!selectedLocationId || (loading && !weather)) {
        return (
            <div className="weather-card weather-card--loading">
                <span className="weather-card__status-text">{t.loading}</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="weather-card weather-card--error">
                <span className="weather-card__status-text">{t.error}</span>
                <button className="weather-card__retry-btn" onClick={refresh}>
                    {t.retry}
                </button>
            </div>
        );
    }

    if (!weather || !weather.current) {
        console.warn(
            "[WeatherModuleContainer] Fetch succeeded but weather payload was empty:",
            weather,
        );
        return (
            <div className="weather-card weather-card--error">
                <span className="weather-card__status-text">{t.noData}</span>
                <button className="weather-card__retry-btn" onClick={refresh}>
                    {t.retry}
                </button>
            </div>
        );
    }

    if (locationOptions.length === 0) {
        console.warn(
            "[WeatherModuleContainer] locationOptions is empty — check useLocation()/settings.locations.",
        );
    }

    const mapped = mapWeatherResponse(weather, lang);

    return (
        <WeatherModule
            locationOptions={locationOptions}
            selectedLocationId={selectedLocationId}
            onLocationChange={handleLocationChange}
            current={mapped.current}
            dailyList={mapped.dailyList}
            hourlyByDay={mapped.hourlyByDay}
            isJapanese={isJapanese}
            userRole={userRole}
            layoutMode={module.settings?.view ?? "combined"}
            onLayoutModeChange={handleLayoutModeChange}
            onRemove={handleRemove}
        />
    );
}
