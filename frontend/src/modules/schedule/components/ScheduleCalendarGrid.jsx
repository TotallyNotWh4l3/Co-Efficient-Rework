// ===================================================
// ファイル名: ScheduleCalendarGrid.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: スケジュールカレンダーグリッド コンポーネント
// ===================================================

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "../../settings/useLanguage";
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
    weekOrientation = "vertical",
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
    const isWeekHorizontal = layout === "week" && weekOrientation === "horizontal";
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

            <div className={`${gridClass}${isWeekHorizontal ? " sch-grid-week-horizontal" : ""}`}>
                {!isWeekHorizontal &&
                    weekdayLabels.map((label, i) => (
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

                    // In horizontal week orientation each day is a full-width
                    // row instead of a narrow column, so the weekday name has
                    // to be shown inline on the row itself rather than in a
                    // shared header above the grid.
                    const weekdayInlineLabel = isWeekHorizontal
                        ? weekdaysShort[day.getDay()]
                        : null;

                    return (
                        <div
                            key={idx}
                            className={`sch-grid-day${layout === "week" ? " sch-grid-day-week" : ""}${
                                isWeekHorizontal ? " sch-grid-day-week-horizontal" : ""
                            }${isToday ? " sch-grid-day-today" : ""}${
                                isCurrentMonth ? "" : " sch-grid-day-outside"
                            }`}
                            onClick={() => onDayClick(dayStr)}
                        >
                            <div className="sch-grid-day-head">
                                {weekdayInlineLabel && (
                                    <span className="sch-day-weekday-inline">
                                        {weekdayInlineLabel}
                                    </span>
                                )}
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
                                <div
                                    className={`sch-day-events-week${
                                        isWeekHorizontal ? " sch-day-events-week-horizontal" : ""
                                    }`}
                                >
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
                                                    {/* Horizontal rows have far more width per
                                                        entry than a narrow weekday column, so the
                                                        time can be shown alongside the title
                                                        instead of being dropped for space. */}
                                                    {isWeekHorizontal && (
                                                        <span className="sch-event-line-time">
                                                            {ev.eventTime}
                                                        </span>
                                                    )}
                                                    {ev.title}
                                                </span>
                                                {ev.subtitle && (
                                                    <span className="sch-event-line-subtitle">
                                                        {ev.subtitle}
                                                    </span>
                                                )}
                                                {isWeekHorizontal && ev.description && (
                                                    <span className="sch-event-line-description">
                                                        {ev.description}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : dayEvents.length === 1 ? (
                                // A single event fits comfortably on the cell,
                                // so show its content directly instead of a
                                // dot the user would have to open the day list
                                // to make sense of.
                                (() => {
                                    const ev = dayEvents[0];
                                    const color = getEventColor(ev, tagsById);
                                    return (
                                        <div
                                            className="sch-event-solo"
                                            style={
                                                color
                                                    ? {
                                                          background: `${color}22`,
                                                          borderColor: `${color}55`,
                                                          color,
                                                      }
                                                    : undefined
                                            }
                                            title={`${ev.eventTime} — ${ev.title}`}
                                        >
                                            <span className="sch-event-solo-title">{ev.title}</span>
                                        </div>
                                    );
                                })()
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
