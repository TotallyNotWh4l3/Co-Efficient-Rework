// ===================================================
// ファイル名: WeatherTabsBar.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 天気タブバー コンポーネント
// ===================================================

import React from "react";
import { useLanguage } from "../../settings/useLanguage";

export default function WeatherTabsBar({ activeTab, onChangeTab }) {
    const lang = useLanguage();
    const t = lang.modules.weather.forecast;

    return (
        <div className="wth-tabs">
            <div className="wth-tabs-group">
                <button
                    onClick={() => onChangeTab("hourly")}
                    className={`wth-tabs-btn${activeTab === "hourly" ? " wth-tabs-btn-active" : ""}`}
                >
                    {t.hourly}
                </button>
                <button
                    onClick={() => onChangeTab("daily")}
                    className={`wth-tabs-btn${activeTab === "daily" ? " wth-tabs-btn-active" : ""}`}
                >
                    {t.daily}
                </button>
            </div>

            {/* <div className="wth-tabs-hint">
                {activeTab === "hourly" ? (
                    <span className="wth-tabs-hint-cyan">{t.hourlyHint}</span>
                ) : (
                    <span className="wth-tabs-hint-white">{t.dailyHint}</span>
                )}
            </div> */}
        </div>
    );
}
