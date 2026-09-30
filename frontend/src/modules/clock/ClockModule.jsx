// ===================================================
// ファイル名: ClockModule.jsx
// 概要: 時計モジュール。デジタル時計と日付を表示する。
//       24時間/12時間、秒、日付の表示は module.settings に保存される。
// ===================================================

import React, { useState } from "react";
import { Settings as SettingsIcon, X } from "lucide-react";
import useClock from "./useClock";
import { useDashboard } from "../dashboard/useDashboard";
import { useLanguage } from "../settings/useLanguage";

import "./clock-module.css";

const pad = (n) => String(n).padStart(2, "0");

// dateNames.dateFormat (en.js / ja.js) is a template using
// {year} {month} {day} {weekday}, so word order stays with the language file.
function formatDate(now, dateNames) {
    const values = {
        year: now.getFullYear(),
        month: dateNames.monthsLong[now.getMonth()],
        weekday: dateNames.weekdaysLong[now.getDay()],
        day: now.getDate(),
    };
    return dateNames.dateFormat.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? "");
}

export default function ClockModule({ module }) {
    const { updateModuleSettings } = useDashboard();
    const lang = useLanguage();
    const t = lang.modules.clock;

    const hour12 = module.settings?.hour12 === true;
    const showSeconds = module.settings?.showSeconds !== false;
    const showDate = module.settings?.showDate !== false;

    const [showOptions, setShowOptions] = useState(false);
    const now = useClock(showSeconds);

    const rawHours = now.getHours();
    const hours = hour12 ? rawHours % 12 || 12 : rawHours;
    const meridiem = hour12 ? (rawHours < 12 ? t.am : t.pm) : null;

    const toggles = [
        { key: "hour12", label: t.options.hour12, value: hour12 },
        { key: "showSeconds", label: t.options.showSeconds, value: showSeconds },
        { key: "showDate", label: t.options.showDate, value: showDate },
    ];

    return (
        <div className="clk-card">
            <button
                className="clk-gear"
                onClick={(e) => {
                    e.stopPropagation();
                    setShowOptions((v) => !v);
                }}
                title={t.options.title}
            >
                {showOptions ? <X className="icon-xs" /> : <SettingsIcon className="icon-xs" />}
            </button>

            <div className="clk-face">
                <div className={`clk-time${showSeconds ? " clk-time--seconds" : ""}`}>
                    <span>{hour12 ? hours : pad(hours)}</span>
                    <span className="clk-sep">:</span>
                    <span>{pad(now.getMinutes())}</span>
                    {showSeconds && (
                        <>
                            <span className="clk-sep">:</span>
                            <span>{pad(now.getSeconds())}</span>
                        </>
                    )}
                    {meridiem && <span className="clk-meridiem">{meridiem}</span>}
                </div>

                {showDate && (
                    <div className="clk-date">{formatDate(now, lang.dateNames)}</div>
                )}
            </div>

            {showOptions && (
                <div className="clk-options" onClick={(e) => e.stopPropagation()}>
                    {toggles.map(({ key, label, value }) => (
                        <button
                            key={key}
                            className={`clk-chip${value ? " clk-chip--on" : ""}`}
                            onClick={() => updateModuleSettings(module.id, key, !value)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
