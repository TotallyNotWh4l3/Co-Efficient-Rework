// ===================================================
// ファイル名: WeatherSettingsPanel.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 天気設定パネル コンポーネント
// ===================================================

import React from "react";
import { Settings } from "lucide-react";
import { useLanguage } from "../../../../hooks/useLanguage";
import "../weather.css";

const LAYOUT_MODES = ["combined", "current", "forecast"];

export default function WeatherSettingsPanel({ layoutMode, onLayoutModeChange, onClose }) {
    const lang = useLanguage();
    const t = lang.modules.weather.settings;

    return (
        <div className="weather-settings">
            <div className="weather-settings__header">
                <span className="weather-settings__title">
                    <Settings className="weather-settings__title-icon" />
                    {t.title}
                </span>
                <button onClick={onClose} className="weather-settings__back">
                    {t.back}
                </button>
            </div>

            <div className="weather-settings__body">
                <div className="weather-settings__group">
                    <label className="weather-settings__group-label">{t.layout.title}</label>

                    <div className="weather-settings__options">
                        {LAYOUT_MODES.map((mode) => {
                            const isActive = layoutMode === mode;
                            const optionText = t.layout[mode];
                            return (
                                <button
                                    key={mode}
                                    onClick={() => onLayoutModeChange && onLayoutModeChange(mode)}
                                    className={`weather-settings__option${isActive ? " weather-settings__option--active" : ""}`}
                                >
                                    <div className="weather-settings__option-top">
                                        <span className="weather-settings__option-name">
                                            {optionText.title}
                                        </span>
                                        {isActive && (
                                            <span className="weather-settings__option-active-tag">
                                                {t.active}
                                            </span>
                                        )}
                                    </div>
                                    <span className="weather-settings__option-desc">
                                        {optionText.description}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* <div className="weather-settings__tip">💡 {t.tip}</div> */}
            </div>
        </div>
    );
}
