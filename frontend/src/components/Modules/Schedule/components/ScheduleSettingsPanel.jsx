// ===================================================
// ファイル名: ScheduleSettingsPanel.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: スケジュール設定パネル コンポーネント
// ===================================================

import React from "react";
import { Settings, Info } from "lucide-react";
import { useLanguage } from "../../../../hooks/useLanguage";
import "../schedule-module.css";

const VIEW_MODES = ["absolute", "relative"];
const LAYOUT_MODES = ["month", "week"];

export default function ScheduleSettingsPanel({
    viewMode,
    onViewModeChange,
    layout,
    onLayoutChange,
    daysBefore,
    onDaysBeforeChange,
    onClose,
}) {
    const lang = useLanguage();
    const t = lang.modules.schedule.settings;
    const rt = lang.modules.schedule.relative;

    const totalDays = layout === "week" ? 7 : 30;
    const daysAhead = totalDays - daysBefore;

    const windowHint = rt.windowHint
        .replace("{before}", daysBefore)
        .replace("{beforePlural}", daysBefore === 1 ? "" : "s")
        .replace("{after}", daysAhead)
        .replace("{afterPlural}", daysAhead === 1 ? "" : "s")
        .replace("{total}", totalDays);

    return (
        <div className="sch-settings">
            <div className="sch-settings__header">
                <span className="sch-settings__title">
                    <Settings className="sch-settings__title-icon" />
                    {t.title}
                </span>
                <button onClick={onClose} className="sch-settings__back">
                    {t.back}
                </button>
            </div>

            <div className="sch-settings__body">
                <div className="sch-settings__group">
                    <label className="sch-settings__group-label">{t.viewMode.title}</label>
                    <div className="sch-settings__options">
                        {VIEW_MODES.map((mode) => {
                            const isActive = viewMode === mode;
                            const optionText = t.viewMode[mode];
                            return (
                                <button
                                    key={mode}
                                    onClick={() => onViewModeChange && onViewModeChange(mode)}
                                    className={`sch-settings__option${isActive ? " sch-settings__option--active" : ""}`}
                                >
                                    <div className="sch-settings__option-top">
                                        <span className="sch-settings__option-name">
                                            {optionText.title}
                                        </span>
                                        {isActive && (
                                            <span className="sch-settings__option-active-tag">
                                                {t.active}
                                            </span>
                                        )}
                                    </div>
                                    <span className="sch-settings__option-desc">
                                        {optionText.description}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {viewMode === "relative" && (
                        <div className="sch-relative-inline">
                            <p className="sch-relative-hint">
                                <Info className="icon-xxs" />
                                {windowHint}
                            </p>

                            <label className="sch-label">
                                {rt.daysBeforeLabel} {daysBefore}
                            </label>
                            <input
                                type="range"
                                min="0"
                                max={totalDays}
                                value={daysBefore}
                                onChange={(e) =>
                                    onDaysBeforeChange &&
                                    onDaysBeforeChange(parseInt(e.target.value, 10))
                                }
                                className="sch-slider"
                            />

                            <button
                                className="sch-btn-secondary"
                                onClick={() => onDaysBeforeChange && onDaysBeforeChange(0)}
                            >
                                {rt.reset}
                            </button>
                        </div>
                    )}
                </div>

                <div className="sch-settings__group">
                    <label className="sch-settings__group-label">{t.layout.title}</label>
                    <div className="sch-settings__options">
                        {LAYOUT_MODES.map((mode) => {
                            const isActive = layout === mode;
                            const optionText = t.layout[mode];
                            return (
                                <button
                                    key={mode}
                                    onClick={() => onLayoutChange && onLayoutChange(mode)}
                                    className={`sch-settings__option${isActive ? " sch-settings__option--active" : ""}`}
                                >
                                    <div className="sch-settings__option-top">
                                        <span className="sch-settings__option-name">
                                            {optionText.title}
                                        </span>
                                        {isActive && (
                                            <span className="sch-settings__option-active-tag">
                                                {t.active}
                                            </span>
                                        )}
                                    </div>
                                    <span className="sch-settings__option-desc">
                                        {optionText.description}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
