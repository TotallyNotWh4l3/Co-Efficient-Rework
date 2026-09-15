
// ===================================================
// ファイル名: WeatherDailyGrid.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 天気日付グリッド コンポーネント
// ===================================================

import React from "react";
import { WeatherVisualIcon } from "../utils/weatherHelpers.jsx";
import "../weather.css";

/**
 * Props:
 * - dailyList: [{ dayLabel, maxTemp, minTemp, weatherCode }]
 * - activeTab: 'hourly' | 'daily'
 * - selectedDayIdx: number
 * - onSelectDay: (idx) => void
 */
export default function WeatherDailyGrid({
    dailyList = [],
    activeTab,
    selectedDayIdx,
    onSelectDay,
}) {
    return (
        <div className="weather-days">
            {dailyList.map((dayItem, idx) => {
                const isSelected = activeTab === "hourly" && selectedDayIdx === idx;
                const isInteractive = activeTab === "hourly";
                const classes = [
                    "weather-days__btn",
                    isInteractive && !isSelected ? "weather-days__btn--interactive" : "",
                    isSelected ? "weather-days__btn--selected" : "",
                ]
                    .filter(Boolean)
                    .join(" ");

                return (
                    <button
                        key={idx}
                        onClick={() => {
                            if (activeTab === "hourly") onSelectDay(idx);
                        }}
                        disabled={activeTab !== "hourly"}
                        className={classes}
                    >
                        <span className="weather-days__label">{dayItem.dayLabel}</span>

                        <div className="weather-days__icon-wrap">
                            <WeatherVisualIcon
                                code={dayItem.weatherCode}
                                isDay={1}
                                className="weather-days__icon"
                            />
                        </div>

                        <div className="weather-days__temps">
                            <span className="weather-days__max">{dayItem.maxTemp}°</span>
                            <span className="weather-days__min">{dayItem.minTemp}°</span>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
