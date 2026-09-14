
// ===================================================
// ファイル名: WeatherStatsRow.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 天気統計行 コンポーネント
// ===================================================

import React from "react";
import { Droplet, Wind, CloudRain } from "lucide-react";
import { useLanguage } from "../../../../hooks/useLanguage";
import "../weather.css";

export default function WeatherStatsRow({ humidity, windSpeed, precipChance }) {
    const lang = useLanguage();
    const t = lang.modules.weather.current;

    return (
        <div className="weather-stats">
            <div className="weather-stats__item">
                <Droplet className="weather-stats__icon weather-stats__icon--humidity" />
                <div className="weather-stats__text">
                    <span className="weather-stats__label">{t.humidity}</span>
                    <span className="weather-stats__value">{humidity}%</span>
                </div>
            </div>

            <div className="weather-stats__item weather-stats__item--middle">
                <Wind className="weather-stats__icon weather-stats__icon--wind" />
                <div className="weather-stats__text">
                    <span className="weather-stats__label">{t.wind}</span>
                    <span className="weather-stats__value">
                        {windSpeed} <span className="weather-stats__unit">m/s</span>
                    </span>
                </div>
            </div>

            <div className="weather-stats__item">
                <CloudRain className="weather-stats__icon weather-stats__icon--precip" />
                <div className="weather-stats__text">
                    <span className="weather-stats__label">{t.precipitation}</span>
                    <span className="weather-stats__value">
                        {precipChance} <span className="weather-stats__unit">%</span>
                    </span>
                </div>
            </div>
        </div>
    );
}
