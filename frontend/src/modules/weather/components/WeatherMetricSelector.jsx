
// ===================================================
// ファイル名: WeatherMetricSelector.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 天気メトリックセレクター コンポーネント
// ===================================================

import React from "react";
import { METRIC_DEFS } from "../utils/weatherHelpers.jsx";
import "../weather.css";

/**
 * Props:
 * - activeMetric: string (metric id)
 * - onSelectMetric: (id) => void
 * - isJapanese: boolean
 */
export default function WeatherMetricSelector({ activeMetric, onSelectMetric, isJapanese }) {
    return (
        <div className="weather-metrics">
            {METRIC_DEFS.map((metric) => {
                const isActive = activeMetric === metric.id;
                const IconComp = metric.icon;
                return (
                    <button
                        key={metric.id}
                        onClick={() => onSelectMetric(metric.id)}
                        className={`weather-metrics__btn${isActive ? " weather-metrics__btn--active" : ""}`}
                        style={{ boxShadow: isActive ? `0 0 10px ${metric.color}25` : "none" }}
                    >
                        <IconComp
                            className="weather-metrics__icon"
                            style={{
                                color: isActive ? "#fff" : metric.color,
                                filter: isActive ? `drop-shadow(0 0 4px ${metric.color})` : "none",
                            }}
                        />
                        {/* <span
                            className={`weather-metrics__label${isActive ? " weather-metrics__label--active" : ""}`}
                        >
                            {isJapanese ? metric.labelJa : metric.labelEn}
                        </span> */}
                    </button>
                );
            })}
        </div>
    );
}
