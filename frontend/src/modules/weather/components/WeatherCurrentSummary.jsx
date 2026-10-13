// ===================================================
// ファイル名: WeatherCurrentSummary.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 天気モジュール 現在の天気概要 コンポーネント
// ===================================================

import React from "react";
import { WeatherVisualIcon, getWeatherDescText } from "../utils/weatherHelpers.jsx";
import { useLanguage } from "../../settings/useLanguage";

export default function WeatherCurrentSummary({ weatherCode, isDay, temp, highTemp, lowTemp }) {
    const lang = useLanguage();
    const t = lang.modules.weather.current;
    const conditions = lang.modules.weather.conditions;

    return (
        <div className="wth-summary">
            <div className="wth-summary-left">
                <WeatherVisualIcon code={weatherCode} isDay={isDay} className="wth-summary-icon" />
                <div className="wth-summary-text">
                    <span className="wth-summary-condition">
                        {getWeatherDescText(weatherCode, conditions)}
                    </span>
                    <span className="wth-summary-code">
                        {t.wmoCode}: {weatherCode}
                    </span>
                </div>
            </div>

            <div className="wth-summary-right">
                <div className="wth-summary-temp-row">
                    <span className="wth-summary-temp-value">{Math.round(temp)}</span>
                    <span className="wth-summary-temp-unit">°C</span>
                </div>
                <span className="wth-summary-hilo">
                    {t.high}: {highTemp}°C &nbsp; {t.low}: {lowTemp}°C
                </span>
            </div>
        </div>
    );
}
