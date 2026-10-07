// ===================================================
// ファイル名: WeatherModule.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 天気モジュール コンポーネント
// ===================================================

import React, { useState, useEffect } from "react";
import WeatherHeader from "./components/WeatherHeader";
import WeatherCurrentSummary from "./components/WeatherCurrentSummary";
import WeatherCurrentView from "./components/WeatherCurrentView";
import WeatherStatsRow from "./components/WeatherStatsRow";
import WeatherForecastSection from "./components/WeatherForecastSection";
import WeatherSettingsPanel from "./components/WeatherSettingsPanel";
import { getWeatherGradient } from "./utils/weatherHelpers";
import "./weather.css";

export default function WeatherModule({
    locationOptions = [],
    selectedLocationId,
    onLocationChange,
    current = {},
    dailyList = [],
    hourlyByDay = {},
    layoutMode = "combined",
    onLayoutModeChange,
    schoolStart = "08:30",
    schoolEnd = "15:30",
    onSchoolTimeChange,
    onRemove,
}) {
    const [activeTab, setActiveTab] = useState("hourly");
    const [activeMetric, setActiveMetric] = useState("temp");
    const [selectedDayIdx, setSelectedDayIdx] = useState(0);
    const [showSettings, setShowSettings] = useState(false);
    const [localLayoutMode, setLocalLayoutMode] = useState(layoutMode);

    useEffect(() => {
        setLocalLayoutMode(layoutMode);
    }, [layoutMode]);

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

    const gradient = getWeatherGradient(weatherCode, isDay);

    // Anything that isn't "current" or "forecast" (including an unexpected saved
    // value) keeps the original combined behavior.
    const showCombinedCurrent = localLayoutMode !== "current" && localLayoutMode !== "forecast";

    // The combined precipitation chart plots chance as its main line (the
    // amount rides along as valueSum); every other metric reads its own key.
    const pickValue = (item) =>
        activeMetric === "precip" ? item.precipChance : item[activeMetric];

    const mapHourlyDay = (items) =>
        (items || []).map((item) => ({
            label: item.time,
            value: pickValue(item),
            valueSum: item.precipSum,
            valueMax: item.maxTemp,
            valueMin: item.minTemp,
        }));

    const chartDataset =
        activeTab === "hourly"
            ? mapHourlyDay(hourlyByDay[selectedDayIdx])
            : dailyList.map((item) => ({
                  label: item.dayLabel,
                  value: pickValue(item),
                  valueSum: item.precipSum,
                  valueMax: item.maxTemp,
                  valueMin: item.minTemp,
              }));

    // Same shape as chartDataset, but one array per day across the whole
    // week — lets WeatherChart scale its axis to the week's min/max on the
    // hourly view instead of just whichever day is currently selected.
    // Object.keys/hourlyByDay ordering matches selectedDayIdx (0, 1, 2, ...)
    // since that's how it's indexed elsewhere in this component.
    const allDaysHourlyDataset =
        activeTab === "hourly"
            ? Object.keys(hourlyByDay)
                  .sort((a, b) => Number(a) - Number(b))
                  .map((dayIdx) => mapHourlyDay(hourlyByDay[dayIdx]))
            : undefined;

    const handleLayoutModeChange = (mode) => {
        setLocalLayoutMode(mode);
        onLayoutModeChange && onLayoutModeChange(mode);
    };

    return (
        <div className="weather-card" style={{ background: gradient }}>
            <WeatherHeader
                locationOptions={locationOptions}
                selectedLocationId={selectedLocationId}
                onLocationChange={onLocationChange}
                showSettings={showSettings}
                onToggleSettings={() => setShowSettings((s) => !s)}
                onRemove={onRemove}
            />

            <div className="weather-body">
                {/* "Current View Only" has its own layout (big icon, colored metric
                    tiles) rather than the Both view with the forecast removed. */}
                {localLayoutMode === "current" && (
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

                {localLayoutMode !== "current" && (
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
            </div>

            {showSettings && (
                <WeatherSettingsPanel
                    layoutMode={localLayoutMode}
                    onLayoutModeChange={handleLayoutModeChange}
                    schoolStart={schoolStart}
                    schoolEnd={schoolEnd}
                    onSchoolTimeChange={onSchoolTimeChange}
                    onClose={() => setShowSettings(false)}
                />
            )}

            <div className="weather-card__flare-top" />
            <div className="weather-card__flare-bottom" />
        </div>
    );
}
