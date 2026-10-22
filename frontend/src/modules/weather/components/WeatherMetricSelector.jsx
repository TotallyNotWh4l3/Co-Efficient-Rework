// ===================================================
// ファイル名: WeatherMetricSelector.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 天気メトリックセレクター コンポーネント
// ===================================================

import React from "react";
import { METRIC_DEFS } from "../utils/weatherHelpers.jsx";

/**
 * Props:
 * - activeMetric: string (metric id)
 * - onSelectMetric: (id) => void
 */
export default function WeatherMetricSelector({ activeMetric, onSelectMetric }) {
    return (
        <div className="wth-metrics">
            {METRIC_DEFS.filter((m) => m.selectable !== false).map((metric) => {
                const isActive = activeMetric === metric.id;
                const IconComp = metric.icon;
                return (
                    <button
                        key={metric.id}
                        onClick={() => onSelectMetric(metric.id)}
                        className={`wth-metrics-btn${isActive ? " wth-metrics-btn-active" : ""}`}
                        style={{
                            boxShadow: isActive
                                ? `0 0 calc(0.625 * var(--u)) ${metric.color}25`
                                : "none",
                        }}
                    >
                        <IconComp
                            className="wth-metrics-icon"
                            style={{
                                color: isActive ? "#fff" : metric.color,
                                filter: isActive
                                    ? `drop-shadow(0 0 calc(0.25 * var(--u)) ${metric.color})`
                                    : "none",
                            }}
                        />
                    </button>
                );
            })}
        </div>
    );
}
