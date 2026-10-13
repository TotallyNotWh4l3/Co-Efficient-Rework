// ===================================================
// ファイル名: WeatherStatsRow.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 天気統計行 コンポーネント
// ===================================================

import React from "react";
import { Droplet, Wind, CloudRain } from "lucide-react";
import { useLanguage } from "../../settings/useLanguage";

export default function WeatherStatsRow({ humidity, windSpeed, precipChance }) {
    const lang = useLanguage();
    const t = lang.modules.weather.current;

    return (
        <div className="wth-stats">
            <div className="wth-stats-item">
                <Droplet className="wth-stats-icon wth-stats-icon-humidity" />
                <div className="wth-stats-text">
                    <span className="wth-stats-label">{t.humidity}</span>
                    <span className="wth-stats-value">{humidity}%</span>
                </div>
            </div>

            <div className="wth-stats-item wth-stats-item-middle">
                <Wind className="wth-stats-icon wth-stats-icon-wind" />
                <div className="wth-stats-text">
                    <span className="wth-stats-label">{t.wind}</span>
                    <span className="wth-stats-value">
                        {windSpeed} <span className="wth-stats-unit">m/s</span>
                    </span>
                </div>
            </div>

            <div className="wth-stats-item">
                <CloudRain className="wth-stats-icon wth-stats-icon-precip" />
                <div className="wth-stats-text">
                    <span className="wth-stats-label">{t.precipitation}</span>
                    <span className="wth-stats-value">
                        {precipChance} <span className="wth-stats-unit">%</span>
                    </span>
                </div>
            </div>
        </div>
    );
}
