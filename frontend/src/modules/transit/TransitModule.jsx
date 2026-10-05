// ===================================================
// ファイル名: TransitModule.jsx
// 作成日: 2026/09/30
// 作成者: ゴンザガ　ウェイン
// 概要: 電車・バスモジュール。選んだ駅/バス停の「次の発車」を方面ごとに表示する。
//       駅/バス停・方面の選択は module.settings (stopId / directionId) に保存される。
//       時刻表データは backend/data/transit/ のJSONから取得する。
// ===================================================

import React, { useState } from "react";
import {
    AlertCircle,
    Accessibility,
    BusFront,
    ChevronDown,
    List,
    RefreshCw,
    Route,
    Settings as SettingsIcon,
    TrainFront,
    X,
} from "lucide-react";
import useClock from "../clock/useClock";
import useTransit from "./useTransit";
import { useDashboard } from "../dashboard/useDashboard";
import { useLanguage } from "../settings/useLanguage";
import TransitLine from "./components/TransitLine";
import { getDayType, getUpcoming } from "./utils/transitHelpers";

import "../schedule/schedule-module.css";
import "./transit-module.css";

const DEFAULT_COUNT = 5;

// Line-view options, stored in module.settings. First value of each list is the default.
const LINE_OPTIONS = [
    { key: "orientation", values: ["horizontal", "vertical"] },
    { key: "colorMode", values: ["mono", "theme"] },
    { key: "timer", values: ["seconds", "minutes"] },
];

const fill = (template, values) =>
    template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? "");

const StopIcon = ({ type, className }) =>
    type === "busStop" ? <BusFront className={className} /> : <TrainFront className={className} />;

function formatWait(wait, t) {
    if (wait < 1) return t.now;
    if (wait < 60) return fill(t.inMin, { n: wait });
    return fill(t.inHourMin, { h: Math.floor(wait / 60), m: wait % 60 });
}

function DepartureRow({ dep, isNext, t }) {
    const typeLabel = t.types[dep.type] ?? dep.type;
    const meta = [dep.multiLine ? dep.line : null, dep.series].filter(Boolean).join(" · ");

    return (
        <li className={`trn-row${isNext ? " trn-row--next" : ""}`}>
            <span className="trn-time">{dep.displayTime}</span>

            <span className="trn-main">
                <span className="trn-dest">
                    {dep.dest ? fill(t.toDest, { dest: dep.dest }) : dep.line}
                </span>
                {(meta || dep.tomorrow || dep.accessible) && (
                    <span className="trn-meta">
                        {dep.tomorrow && <span className="trn-tomorrow">{t.tomorrow}</span>}
                        {meta && <span>{meta}</span>}
                        {dep.accessible && (
                            <Accessibility className="trn-access" aria-label={t.accessible} />
                        )}
                    </span>
                )}
            </span>

            <span className={`trn-type trn-type--${dep.type}`}>{typeLabel}</span>
            <span className="trn-wait">{formatWait(dep.wait, t)}</span>
        </li>
    );
}

export default function TransitModule({ module }) {
    const { updateModuleSettings, ensureModuleMinSize } = useDashboard();
    const lang = useLanguage();
    const t = lang.modules.transit;

    // "board": departure list (one direction at a time). "line": map-style line, one lane per direction.
    const view = module.settings?.view === "line" ? "line" : "board";
    // The line view animates per second; the list only needs the minute.
    const now = useClock(view === "line");

    const stopId = module.settings?.stopId ?? null;
    const directionId = module.settings?.directionId ?? null;
    const requestedCount = Number(module.settings?.count);
    const count = Number.isInteger(requestedCount)
        ? Math.min(Math.max(requestedCount, 1), 12)
        : DEFAULT_COUNT;

    const { stops, stop, isLoading, error, stopMissing, reload } = useTransit(stopId);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [optionsOpen, setOptionsOpen] = useState(false);

    const lineSettings = {
        orientation: module.settings?.orientation === "vertical" ? "vertical" : "horizontal",
        colorMode: module.settings?.colorMode === "theme" ? "theme" : "mono",
        timer: module.settings?.timer === "minutes" ? "minutes" : "seconds",
    };

    // 未選択、または選んだ駅が見つからないときは、選択リストを自動で開く
    const showPicker = stops.length > 0 && (pickerOpen || !stopId || stopMissing);

    const direction = stop
        ? (stop.directions.find((d) => d.id === directionId) ?? stop.directions[0])
        : null;
    const upcoming = direction ? getUpcoming(direction, now, count) : [];

    const switchView = () => {
        const next = view === "line" ? "board" : "line";
        updateModuleSettings(module.id, "view", next);
        ensureModuleMinSize(module.id, next);
    };

    const chooseStop = (id) => {
        updateModuleSettings(module.id, "stopId", id);
        setPickerOpen(false);
    };

    let body;
    if (isLoading) {
        body = (
            <div className="sch-empty-state">
                <RefreshCw className="icon-sm sch-spin" />
                <p className="sch-empty-text">{t.status.loading}</p>
            </div>
        );
    } else if (error) {
        body = (
            <div className="sch-empty-state">
                <AlertCircle className="icon-sm sch-error-text" />
                <p className="sch-empty-title sch-error-text">{t.status.errorTitle}</p>
                <p className="sch-empty-text">{error}</p>
                <button className="sch-btn-secondary" onClick={reload}>
                    {t.status.retry}
                </button>
            </div>
        );
    } else if (stops.length === 0) {
        body = (
            <div className="sch-empty-state">
                <p className="sch-empty-text">{t.noStops}</p>
            </div>
        );
    } else if (!stop) {
        body = (
            <div className="sch-empty-state">
                <p className="sch-empty-text">{stopMissing ? t.stopMissing : t.selectStop}</p>
            </div>
        );
    } else if (view === "line") {
        body = (
            <div
                className={`trl-lanes${lineSettings.orientation === "vertical" ? " trl-lanes--vertical" : ""}`}
            >
                {stop.directions.map((d) => (
                    <TransitLine
                        key={d.id}
                        direction={d}
                        mode={stop.type}
                        now={now}
                        t={t}
                        vertical={lineSettings.orientation === "vertical"}
                        themed={lineSettings.colorMode === "theme"}
                        minutesOnly={lineSettings.timer === "minutes"}
                    />
                ))}
            </div>
        );
    } else {
        body = (
            <div className="trn-content">
                {stop.directions.length > 1 && (
                    <div className="trn-tabs" role="tablist">
                        {stop.directions.map((d) => (
                            <button
                                key={d.id}
                                role="tab"
                                aria-selected={d.id === direction.id}
                                className={`trn-tab${d.id === direction.id ? " trn-tab--on" : ""}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    updateModuleSettings(module.id, "directionId", d.id);
                                }}
                            >
                                {d.label}
                            </button>
                        ))}
                    </div>
                )}

                {stop.directions.length === 1 && <p className="trn-direction">{direction.label}</p>}

                {upcoming.length === 0 ? (
                    <div className="sch-empty-state">
                        <p className="sch-empty-text">{t.noService}</p>
                    </div>
                ) : (
                    <ul className="trn-list">
                        {upcoming.map((dep, i) => (
                            <DepartureRow
                                key={`${dep.line}-${dep.displayTime}-${dep.dest}-${dep.tomorrow ? "t" : "d"}-${i}`}
                                dep={dep}
                                isNext={i === 0}
                                t={t}
                            />
                        ))}
                    </ul>
                )}
            </div>
        );
    }

    return (
        <div className={`sch-card${view === "board" ? " trn-card--board" : ""}`}>
            <div className="sch-glow sch-glow-top" />

            <div className="sch-header">
                <div className="sch-header-left">
                    <div className="sch-header-icon">
                        <StopIcon type={stop?.type} className="icon-sm" />
                    </div>
                    <div>
                        <h3 className="sch-header-title">{stop?.name ?? t.header.title}</h3>
                        {stop && (
                            <p className="trn-daytype">{t.dayTypes[getDayType(now)]}</p>
                        )}
                    </div>
                </div>

                {stops.length > 0 && (
                    <div className="trl-header-actions">
                        {stop && (
                            <button
                                className="trn-picker-btn"
                                title={view === "line" ? t.views.toBoard : t.views.toLine}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    switchView();
                                }}
                            >
                                {view === "line" ? (
                                    <List className="icon-xs" />
                                ) : (
                                    <Route className="icon-xs" />
                                )}
                            </button>
                        )}
                        {stop && view === "line" && (
                            <button
                                className="trn-picker-btn"
                                title={t.options.title}
                                aria-expanded={optionsOpen}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOptionsOpen((v) => !v);
                                    setPickerOpen(false);
                                }}
                            >
                                {optionsOpen ? (
                                    <X className="icon-xs" />
                                ) : (
                                    <SettingsIcon className="icon-xs" />
                                )}
                            </button>
                        )}
                        <button
                            className="trn-picker-btn"
                            title={t.header.changeStop}
                            aria-expanded={showPicker}
                            onClick={(e) => {
                                e.stopPropagation();
                                setPickerOpen((v) => !v);
                                setOptionsOpen(false);
                            }}
                        >
                            <ChevronDown className="icon-xs" />
                        </button>
                    </div>
                )}
            </div>

            <div className="sch-body">{body}</div>

            {optionsOpen && view === "line" && stop && (
                <div className="trl-options" onClick={(e) => e.stopPropagation()}>
                    {LINE_OPTIONS.map(({ key, values }) => (
                        <div key={key} className="trl-option-row">
                            <span className="trl-option-label">{t.options[key].label}</span>
                            {values.map((value) => (
                                <button
                                    key={value}
                                    className={`trl-chip${lineSettings[key] === value ? " trl-chip--on" : ""}`}
                                    onClick={() => updateModuleSettings(module.id, key, value)}
                                >
                                    {t.options[key][value]}
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {showPicker && (
                <ul className="trn-picker" onClick={(e) => e.stopPropagation()}>
                    {stops.map((s) => (
                        <li key={s.id}>
                            <button
                                className={`trn-picker-item${s.id === stopId ? " trn-picker-item--on" : ""}`}
                                onClick={() => chooseStop(s.id)}
                            >
                                <StopIcon type={s.type} className="icon-xs" />
                                <span>{s.name}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
