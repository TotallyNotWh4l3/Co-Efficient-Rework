// ===================================================
// ファイル名: WeatherDailyGrid.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 天気日付グリッド コンポーネント
// ===================================================

import React from "react";
import { WeatherVisualIcon } from "../utils/weatherHelpers.jsx";

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
        <div className="wth-days">
            {dailyList.map((dayItem, idx) => {
                const isSelected = activeTab === "hourly" && selectedDayIdx === idx;
                const isInteractive = activeTab === "hourly";
                const classes = [
                    "wth-days-btn",
                    isInteractive && !isSelected ? "wth-days-btn-interactive" : "",
                    isSelected ? "wth-days-btn-selected" : "",
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
                        <span className="wth-days-label">{dayItem.dayLabel}</span>

                        <div className="wth-days-icon-wrap">
                            <WeatherVisualIcon
                                code={dayItem.weatherCode}
                                isDay={1}
                                className="wth-days-icon"
                            />
                        </div>

                        <div className="wth-days-temps">
                            <span className="wth-days-max">{dayItem.maxTemp}°</span>
                            <span className="wth-days-min">{dayItem.minTemp}°</span>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
