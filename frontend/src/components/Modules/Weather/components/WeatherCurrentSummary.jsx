// ===================================================
// ファイル名: WeatherCurrentSummary.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 天気モジュール 現在の天気概要 コンポーネント
// ===================================================


import React from "react";
import { WeatherVisualIcon, getWeatherDescText } from "../utils/weatherHelpers.jsx";
import { useLanguage } from "../../../../hooks/useLanguage";
import "../weather.css";

export default function WeatherCurrentSummary({
    weatherCode,
    isDay,
    temp,
    highTemp,
    lowTemp,
    isJapanese,
}) {
    const lang = useLanguage();
    const t = lang.modules.weather.current;

    return (
        <div className="weather-summary">
            <div className="weather-summary__left">
                <WeatherVisualIcon
                    code={weatherCode}
                    isDay={isDay}
                    className="weather-summary__icon"
                />
                <div className="weather-summary__text">
                    <span className="weather-summary__condition">
                        {getWeatherDescText(weatherCode, isJapanese)}
                    </span>
                    <span className="weather-summary__code">
                        {t.wmoCode}: {weatherCode}
                    </span>
                </div>
            </div>

            <div className="weather-summary__right">
                <div className="weather-summary__temp-row">
                    <span className="weather-summary__temp-value">{Math.round(temp)}</span>
                    <span className="weather-summary__temp-unit">°C</span>
                </div>
                <span className="weather-summary__hilo">
                    {t.high}: {highTemp}°C &nbsp; {t.low}: {lowTemp}°C
                </span>
            </div>
        </div>
    );
}