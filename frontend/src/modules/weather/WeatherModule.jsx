// ===================================================
// ファイル名: WeatherModule.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 天気モジュール コンポーネント
//       旧 WeatherModuleContainer と統合。他のモジュールと同じく
//       module だけを受け取り、データ取得・場所の選択・ヘッダーの
//       折りたたみ状態は内部のフックで扱う。
//
//       module.settings:
//         location        選択中の場所ID
//         view            "combined" | "current" | "forecast"
//         schoolStart/End 授業時間の帯 (チャート表示用)
//         headerCollapsed ヘッダーの折りたたみ
// ===================================================

import React, { useState, useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import useWeather from "./useWeather";
import { useLocation } from "../locations/useLocation";
import { useDashboard } from "../dashboard/useDashboard";
import { useSettings } from "../settings/useSettings";
import { useLanguage } from "../settings/useLanguage";
import WeatherHeader from "./components/WeatherHeader";
import CollapsibleHeader from "../../common/ModuleHost/CollapsibleHeader";
import useHeaderCollapse from "../../common/ModuleHost/useHeaderCollapse";
import WeatherCurrentSummary from "./components/WeatherCurrentSummary";
import WeatherCurrentView from "./components/WeatherCurrentView";
import WeatherStatsRow from "./components/WeatherStatsRow";
import WeatherForecastSection from "./components/WeatherForecastSection";
import { mapWeatherResponse } from "./utils/mapWeatherResponse";
import { getWeatherGradient } from "./utils/weatherHelpers";

import "./weather.css";

// Used until a school start/end time is chosen in the module's settings.
const DEFAULT_SCHOOL_START = "08:30";
const DEFAULT_SCHOOL_END = "15:30";

export default function WeatherModule({ module }) {
    const lang = useLanguage();
    const t = lang.modules.weather.current;
    const { locationOptions } = useLocation();
    const { updateModuleSettings } = useDashboard();
    const { settings } = useSettings();
    const header = useHeaderCollapse(module);

    // ---- Settings (edited on the Module Settings page) ----
    // Anything that isn't "current" or "forecast" (including an unexpected
    // saved value) keeps the original combined behavior.
    const view = module.settings?.view ?? "combined";
    const showCurrentOnly = view === "current";
    const showCombinedCurrent = view !== "current" && view !== "forecast";
    const schoolStart = module.settings?.schoolStart ?? DEFAULT_SCHOOL_START;
    const schoolEnd = module.settings?.schoolEnd ?? DEFAULT_SCHOOL_END;

    // ---- Location ----
    const [selectedLocationId, setSelectedLocationId] = useState(module.settings?.location);

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

    // ---- Data ----
    const { weather, loading, error, refresh } = useWeather(selectedLocationId);
    const isLoading = !selectedLocationId || (loading && !weather);
    const mapped = weather?.current ? mapWeatherResponse(weather, lang) : null;

    const { current = {}, dailyList = [], hourlyByDay = {} } = mapped ?? {};
    const {
        temperature = 0,
        humidity = 0,
        windSpeed = 0,
        precipChance = 0,
        weatherCode = 3,
        isDay = 1,
        highTemp = 0,
        lowTemp = 0,
        time = "--:--",
    } = current;

    // ---- Forecast chart state ----
    const [activeTab, setActiveTab] = useState("hourly");
    const [activeMetric, setActiveMetric] = useState("temp");
    const [selectedDayIdx, setSelectedDayIdx] = useState(0);

    // Each chart point carries the whole hourly/daily item; WeatherChart reads
    // whichever fields the active metric's lines need (see METRIC_DEFS).
    const mapHourlyDay = (items) => (items || []).map((item) => ({ label: item.time, item }));

    const chartDataset =
        activeTab === "hourly"
            ? mapHourlyDay(hourlyByDay[selectedDayIdx])
            : dailyList.map((item) => ({ label: item.dayLabel, item }));

    // Same shape as chartDataset, but one array per day across the whole
    // week — lets WeatherChart scale its axis to the week's min/max on the
    // hourly view instead of just whichever day is currently selected.
    const allDaysHourlyDataset =
        activeTab === "hourly"
            ? Object.keys(hourlyByDay)
                  .sort((a, b) => Number(a) - Number(b))
                  .map((dayIdx) => mapHourlyDay(hourlyByDay[dayIdx]))
            : undefined;

    // The weather gradient needs data; without it the card falls back to the
    // surface color set in weather-module.css.
    const cardStyle = mapped ? { background: getWeatherGradient(weatherCode, isDay) } : undefined;

    return (
        <div className="wth-card" style={cardStyle}>
            <CollapsibleHeader collapsed={header.collapsed} onToggle={header.toggle}>
                <WeatherHeader
                    locationOptions={locationOptions}
                    selectedLocationId={selectedLocationId}
                />
            </CollapsibleHeader>

            <div className="wth-body">
                {isLoading ? (
                    <div className="wth-empty-state">
                        <RefreshCw className="wth-state-icon wth-spin" />
                        <p className="wth-empty-text">{t.loading}</p>
                    </div>
                ) : error ? (
                    <div className="wth-empty-state">
                        <AlertCircle className="wth-state-icon wth-error-text" />
                        <p className="wth-empty-title wth-error-text">{t.error}</p>
                        <button className="wth-btn-retry" onClick={refresh}>
                            {t.retry}
                        </button>
                    </div>
                ) : !mapped ? (
                    <div className="wth-empty-state">
                        <AlertCircle className="wth-state-icon" />
                        <p className="wth-empty-text">{t.noData}</p>
                        <button className="wth-btn-retry" onClick={refresh}>
                            {t.retry}
                        </button>
                    </div>
                ) : (
                    <>
                        {/* "Current View Only" has its own layout (big icon, colored
                            metric tiles) rather than the Both view with the forecast
                            removed. */}
                        {showCurrentOnly && (
                            <WeatherCurrentView
                                weatherCode={weatherCode}
                                isDay={isDay}
                                temp={temperature}
                                highTemp={highTemp}
                                lowTemp={lowTemp}
                                humidity={humidity}
                                windSpeed={windSpeed}
                                precipChance={precipChance}
                            />
                        )}

                        {showCombinedCurrent && (
                            <WeatherCurrentSummary
                                weatherCode={weatherCode}
                                isDay={isDay}
                                temp={temperature}
                                highTemp={highTemp}
                                lowTemp={lowTemp}
                            />
                        )}

                        {showCombinedCurrent && (
                            <WeatherStatsRow
                                humidity={humidity}
                                windSpeed={windSpeed}
                                precipChance={precipChance}
                            />
                        )}

                        {!showCurrentOnly && (
                            <WeatherForecastSection
                                activeMetric={activeMetric}
                                onSelectMetric={setActiveMetric}
                                dailyList={dailyList}
                                activeTab={activeTab}
                                onChangeTab={setActiveTab}
                                selectedDayIdx={selectedDayIdx}
                                onSelectDay={setSelectedDayIdx}
                                chartDataset={chartDataset}
                                allDaysHourlyDataset={allDaysHourlyDataset}
                                timeString={time}
                                schoolStart={schoolStart}
                                schoolEnd={schoolEnd}
                                nowTime={time}
                                // dailyList[0] is today; the "now" line only makes sense there.
                                showNow={selectedDayIdx === 0}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}