
// ===================================================
// ファイル名: WeatherForecastSection.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 天気予報セクション コンポーネント
// ===================================================

import React from "react";
import { Clock } from "lucide-react";
import WeatherMetricSelector from "./WeatherMetricSelector";
import WeatherDailyGrid from "./WeatherDailyGrid";
import WeatherTabsBar from "./WeatherTabsBar";
import WeatherChart from "./WeatherChart";
import { METRIC_DEFS } from "../utils/weatherHelpers.jsx";
import { useLanguage } from "../../../../hooks/useLanguage";
import "../weather.css";

export default function WeatherForecastSection({
    isJapanese,
    activeMetric,
    onSelectMetric,
    dailyList,
    activeTab,
    onChangeTab,
    selectedDayIdx,
    onSelectDay,
    chartDataset,
    // Hourly dataset for EVERY day of the week (same shape as chartDataset,
    // one entry per day), so WeatherChart can scale its axis to the whole
    // week instead of just whichever day is currently selected. Only needed
    // when activeTab === "hourly" — pass whatever your data hook already
    // holds for the 7-day hourly forecast.
    allDaysHourlyDataset,
    timeString,
}) {
    const lang = useLanguage();
    const t = lang.modules.weather.forecast;
    const activeMetricInfo = METRIC_DEFS.find((m) => m.id === activeMetric) || METRIC_DEFS[0];

    return (
        <>
            <div className="weather-section-title">
                <span className="weather-section-title__label">{t.title}</span>
                <span className="weather-section-title__rule"></span>
            </div>

            <WeatherMetricSelector
                activeMetric={activeMetric}
                onSelectMetric={onSelectMetric}
                isJapanese={isJapanese}
            />

            <WeatherDailyGrid
                dailyList={dailyList}
                activeTab={activeTab}
                selectedDayIdx={selectedDayIdx}
                onSelectDay={onSelectDay}
            />

            <WeatherTabsBar activeTab={activeTab} onChangeTab={onChangeTab} />

            <WeatherChart
                dataset={chartDataset}
                metricInfo={activeMetricInfo}
                isJapanese={isJapanese}
                isHourly={activeTab === "hourly"}
                allDaysDataset={activeTab === "hourly" ? allDaysHourlyDataset : undefined}
            />

            <div className="weather-updated">
                <div className="weather-updated__inner">
                    <Clock className="weather-updated__icon" />
                    <span className="weather-updated__text">
                        {t.updated} {timeString}
                    </span>
                </div>
            </div>
        </>
    );
}
