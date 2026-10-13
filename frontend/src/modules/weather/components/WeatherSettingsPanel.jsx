// ===================================================
// ファイル名: WeatherSettingsPanel.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 天気設定パネル コンポーネント
// ===================================================

import React from "react";
import { Settings } from "lucide-react";
import { useLanguage } from "../../settings/useLanguage";

const LAYOUT_MODES = ["combined", "current", "forecast"];

export default function WeatherSettingsPanel({
    layoutMode,
    onLayoutModeChange,
    schoolStart,
    schoolEnd,
    onSchoolTimeChange,
    onClose,
}) {
    const lang = useLanguage();
    const t = lang.modules.weather.settings;

    return (
        <div className="wth-settings">
            <div className="wth-settings-header">
                <span className="wth-settings-title">
                    <Settings className="wth-settings-title-icon" />
                    {t.title}
                </span>
                <button onClick={onClose} className="wth-settings-back">
                    {t.back}
                </button>
            </div>

            <div className="wth-settings-body">
                <div className="wth-settings-group">
                    <label className="wth-settings-group-label">{t.layout.title}</label>

                    <div className="wth-settings-options">
                        {LAYOUT_MODES.map((mode) => {
                            const isActive = layoutMode === mode;
                            const optionText = t.layout[mode];
                            return (
                                <button
                                    key={mode}
                                    onClick={() => onLayoutModeChange && onLayoutModeChange(mode)}
                                    className={`wth-settings-option${isActive ? " wth-settings-option-active" : ""}`}
                                >
                                    <div className="wth-settings-option-top">
                                        <span className="wth-settings-option-name">
                                            {optionText.title}
                                        </span>
                                        {isActive && (
                                            <span className="wth-settings-option-active-tag">
                                                {t.active}
                                            </span>
                                        )}
                                    </div>
                                    <span className="wth-settings-option-desc">
                                        {optionText.description}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="wth-settings-group">
                    <label className="wth-settings-group-label">{t.schoolHours.title}</label>
                    <div className="wth-settings-time-row">
                        <label className="wth-settings-time-field">
                            <span>{t.schoolHours.start}</span>
                            <input
                                type="time"
                                value={schoolStart}
                                onChange={(e) =>
                                    onSchoolTimeChange &&
                                    onSchoolTimeChange("schoolStart", e.target.value)
                                }
                            />
                        </label>
                        <label className="wth-settings-time-field">
                            <span>{t.schoolHours.end}</span>
                            <input
                                type="time"
                                value={schoolEnd}
                                onChange={(e) =>
                                    onSchoolTimeChange &&
                                    onSchoolTimeChange("schoolEnd", e.target.value)
                                }
                            />
                        </label>
                    </div>
                </div>

                {/* <div className="wth-settings-tip">💡 {t.tip}</div> */}
            </div>
        </div>
    );
}
