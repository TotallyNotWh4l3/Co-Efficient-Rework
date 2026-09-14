
// ===================================================
// ファイル名: ScheduleCalendarGrid.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: スケジュールカレンダーグリッド コンポーネント
// ===================================================

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "../../../../hooks/useLanguage";
import {
    getMonthGridDays,
    getWeekDays,
    formatDateStr,
    hasConflict,
    getEventColor,
} from "../utils/scheduleHelpers";

export default function ScheduleCalendarGrid({
    anchorDate,
    layout,
    days: daysOverride,
    onPrev,
    onNext,
    onToday,
    eventsByDay,
    tagsById,
    onDayClick,
    hideNav = false,
}) {
    const lang = useLanguage();
    const t = lang.modules.schedule.calendar;
    const { monthsLong, weekdaysShort } = lang.dateNames;

    const todayStr = formatDateStr(new Date());
    const days =
        daysOverride ??
        (layout === "week" ? getWeekDays(anchorDate) : getMonthGridDays(anchorDate));
    const gridClass = layout === "week" ? "sch-grid sch-grid-week" : "sch-grid";

    const navLabel =
        layout === "week"
            ? `${t.weekOf} ${monthsLong[anchorDate.getMonth()].slice(0, 3)} ${anchorDate.getDate()}, ${anchorDate.getFullYear()}`
            : `${monthsLong[anchorDate.getMonth()]} ${anchorDate.getFullYear()}`;

    // weekdaysShort is always the fixed Sun-Sat header row; daysOverride
    // (relative view) still walks actual dates but the header stays static.
    const weekdayLabels = daysOverride
        ? days.slice(0, 7).map((d) => weekdaysShort[d.getDay()])
        : weekdaysShort;

    return (
        <>
            {!hideNav && (
                <div className="sch-nav">
                    <span className="sch-nav-label">{navLabel}</span>
                    <div className="sch-nav-controls">
                        <button className="sch-nav-btn" onClick={onPrev}>
                            <ChevronLeft className="icon-xs" />
                        </button>
                        <button className="sch-nav-btn sch-nav-today" onClick={onToday}>
                            {t.today}
                        </button>
                        <button className="sch-nav-btn" onClick={onNext}>
                            <ChevronRight className="icon-xs" />
                        </button>
                    </div>
                </div>
            )}

            <div className={gridClass}>
                {weekdayLabels.map((label, i) => (
                    <div key={`${label}-${i}`} className="sch-grid-weekday">
                        {label}
                    </div>
                ))}

                {days.map((day, idx) => {
                    const dayStr = formatDateStr(day);
                    const isToday = dayStr === todayStr;
                    const isCurrentMonth =
                        layout === "week" ||
                        daysOverride ||
                        day.getMonth() === anchorDate.getMonth();
                    const dayEvents = eventsByDay[dayStr] || [];
                    const conflict = hasConflict(dayEvents);

                    return (
                        <div
                            key={idx}
                            className={`sch-grid-day${layout === "week" ? " sch-grid-day-week" : ""}${
                                isToday ? " sch-grid-day-today" : ""
                            }${isCurrentMonth ? "" : " sch-grid-day-outside"}`}
                            onClick={() => onDayClick(dayStr)}
                        >
                            <div className="sch-grid-day-head">
                                <span
                                    className={`sch-day-number${isToday ? " sch-day-number-today" : ""}`}
                                >
                                    {day.getDate()}
                                </span>
                                {conflict && (
                                    <span className="sch-conflict-badge" title={t.conflictTitle}>
                                        !
                                    </span>
                                )}
                            </div>

                            {layout === "week" ? (
                                <div className="sch-day-events-week">
                                    {dayEvents.map((ev) => {
                                        const color = getEventColor(ev, tagsById);
                                        return (
                                            <div
                                                key={ev.id}
                                                className="sch-event-line"
                                                style={
                                                    color
                                                        ? {
                                                              background: `${color}22`,
                                                              borderColor: `${color}55`,
                                                              color,
                                                          }
                                                        : undefined
                                                }
                                            >
                                                <span className="sch-event-line-title">
                                                    {ev.title}
                                                </span>
                                                {ev.subtitle && (
                                                    <span className="sch-event-line-subtitle">
                                                        {ev.subtitle}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="sch-day-events">
                                    {dayEvents.slice(0, 6).map((ev) => {
                                        const color = getEventColor(ev, tagsById);
                                        return (
                                            <span
                                                key={ev.id}
                                                className="sch-event-dot"
                                                style={
                                                    color
                                                        ? {
                                                              background: color,
                                                              boxShadow: `0 0 4px ${color}88`,
                                                          }
                                                        : undefined
                                                }
                                                title={`${ev.eventTime} — ${ev.title}`}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </>
    );
}
