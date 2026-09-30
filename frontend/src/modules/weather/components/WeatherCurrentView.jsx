// ===================================================
// ファイル名: WeatherCurrentView.jsx
// 概要: 天気モジュール「現在のみ」表示専用のレイアウト。
//       「両方」表示の一部を切り出したものではなく、ひと目で今の天気が
//       分かることを目的に、大きなアイコン・大きな気温・色分けした
//       指標タイル(バー付き)で構成している。
// ===================================================

import React from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { WeatherVisualIcon, getWeatherDescText, METRIC_DEFS } from "../utils/weatherHelpers.jsx";
import { useLanguage } from "../../settings/useLanguage";
import "../weather.css";

const metricDef = (id) => METRIC_DEFS.find((m) => m.id === id);

// Wind has no natural 0-100 scale; treat 15 m/s (a strong wind) as a full bar.
const WIND_FULL_BAR_MS = 15;

const clampPercent = (n) => Math.max(0, Math.min(100, Number(n) || 0));

export default function WeatherCurrentView({
    weatherCode,
    isDay,
    temp,
    highTemp,
    lowTemp,
    humidity,
    windSpeed,
    precipChance,
}) {
    const lang = useLanguage();
    const t = lang.modules.weather.current;
    const conditions = lang.modules.weather.conditions;

    const tiles = [
        {
            def: metricDef("humidity"),
            label: t.humidity,
            value: humidity,
            unit: "%",
            percent: clampPercent(humidity),
        },
        {
            def: metricDef("precipChance"),
            label: t.precipitation,
            value: precipChance,
            unit: "%",
            percent: clampPercent(precipChance),
        },
        {
            def: metricDef("windSpeed"),
            label: t.wind,
            value: windSpeed,
            unit: "m/s",
            percent: clampPercent((Number(windSpeed) / WIND_FULL_BAR_MS) * 100),
        },
    ];

    return (
        <div className="wcv">
            <div className="wcv__hero">
                <WeatherVisualIcon code={weatherCode} isDay={isDay} className="wcv__icon" />

                <div className="wcv__hero-text">
                    <div className="wcv__temp">
                        <span className="wcv__temp-value">{Math.round(temp)}</span>
                        <span className="wcv__temp-unit">°C</span>
                    </div>
                    <span className="wcv__condition">
                        {getWeatherDescText(weatherCode, conditions)}
                    </span>
                    <div className="wcv__hilo">
                        <span className="wcv__hi">
                            <ArrowUp className="wcv__hilo-icon" />
                            {t.high} {highTemp}°
                        </span>
                        <span className="wcv__lo">
                            <ArrowDown className="wcv__hilo-icon" />
                            {t.low} {lowTemp}°
                        </span>
                    </div>
                </div>
            </div>

            <div className="wcv__metrics">
                {tiles.map(({ def, label, value, unit, percent }) => {
                    const Icon = def.icon;
                    return (
                        <div
                            key={def.id}
                            className="wcv__tile"
                            style={{ "--metric": def.color, "--fill": `${percent}%` }}
                        >
                            <span className="wcv__tile-badge">
                                <Icon className="wcv__tile-icon" />
                            </span>
                            <div className="wcv__tile-body">
                                <span className="wcv__tile-value">
                                    {value}
                                    <span className="wcv__tile-unit">{unit}</span>
                                </span>
                                <span className="wcv__tile-label">{label}</span>
                            </div>
                            <span className="wcv__bar">
                                <span className="wcv__bar-fill" style={{ width: `${percent}%` }} />
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
