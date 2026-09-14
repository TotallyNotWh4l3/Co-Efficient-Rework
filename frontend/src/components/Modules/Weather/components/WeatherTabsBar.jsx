// ===================================================
// ファイル名: WeatherTabsBar.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 天気タブバー コンポーネント   
// ===================================================

import React from "react";
import { useLanguage } from "../../../../hooks/useLanguage";
import "../weather.css";

export default function WeatherTabsBar({ activeTab, onChangeTab }) {
    const lang = useLanguage();
    const t = lang.modules.weather.forecast;

    return (
        <div className="weather-tabs">
            <div className="weather-tabs__group">
                <button
                    onClick={() => onChangeTab("hourly")}
                    className={`weather-tabs__btn${activeTab === "hourly" ? " weather-tabs__btn--active" : ""}`}
                >
                    {t.hourly}
                </button>
                <button
                    onClick={() => onChangeTab("daily")}
                    className={`weather-tabs__btn${activeTab === "daily" ? " weather-tabs__btn--active" : ""}`}
                >
                    {t.daily}
                </button>
            </div>

            {/* <div className="weather-tabs__hint">
                {activeTab === "hourly" ? (
                    <span className="weather-tabs__hint--cyan">{t.hourlyHint}</span>
                ) : (
                    <span className="weather-tabs__hint--white">{t.dailyHint}</span>
                )}
            </div> */}
        </div>
    );
}
