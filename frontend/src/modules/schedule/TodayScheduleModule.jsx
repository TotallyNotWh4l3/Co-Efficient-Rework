// ===================================================
// ファイル名: TodayScheduleModule.jsx
// 概要: 今日の予定と明日の予定を表示するモジュール。
//       既存のスケジュールデータ(useSchedule)を日付で絞り込んで表示するだけの
//       ビューであり、新しいデータモデルは不要。
//       今日が主役(本文の約70%)、明日は小さく表示する。明日の予定が複数ある
//       場合はボックスのグリッド表示にする。予定をクリックすると、スケジュール
//       モジュールと同じ詳細ウィンドウが開く。
// ===================================================

import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarClock, RefreshCw } from "lucide-react";
import useSchedule from "./useSchedule";
import useScheduleTags from "./useScheduleTags";
import { useAuth } from "../auth/useAuth";
import { useLanguage } from "../settings/useLanguage";
import ScheduleDetailModal from "./components/ScheduleDetailModal";
import ScheduleEventFormModal from "./components/ScheduleEventFormModal";
import { formatDateStr, formatDisplayDate, getEventColor } from "./utils/scheduleHelpers";
import {
    getServerNow,
    startServerClockSync,
    subscribeServerClock,
} from "../../shared/utils/serverClock";

import CollapsibleHeader from "../../common/ModuleHost/CollapsibleHeader";
import useHeaderCollapse from "../../common/ModuleHost/useHeaderCollapse";
import "./schedule-module.css";
import "./today-schedule-module.css";

const TICK_MS = 30 * 1000;

/**
 * Current Date (server-corrected, so a drifting device clock doesn't matter),
 * refreshed on an interval so "past" styling and the midnight rollover stay correct.
 */
function useNow(intervalMs = TICK_MS) {
    const [now, setNow] = useState(() => getServerNow());
    useEffect(() => {
        startServerClockSync();
        const id = setInterval(() => setNow(getServerNow()), intervalMs);
        const unsubscribe = subscribeServerClock(() => setNow(getServerNow()));
        return () => {
            clearInterval(id);
            unsubscribe();
        };
    }, [intervalMs]);
    return now;
}

function formatHHMM(date) {
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function EventRow({ ev, color, size, isPast, isNext, onSelect }) {
    return (
        <li>
            <button
                type="button"
                className={`tsm-row tsm-row--${size}${isPast ? " tsm-row--past" : ""}${isNext ? " tsm-row--next" : ""}`}
                onClick={() => onSelect(ev)}
            >
                <span
                    className="sch-tag-dot"
                    style={color ? { background: color } : { visibility: "hidden" }}
                />
                <span className="tsm-time">{ev.eventTime}</span>
                <span className="sch-daylist-title-group">
                    <span className="tsm-title">{ev.title}</span>
                    {ev.subtitle && <span className="tsm-subtitle">{ev.subtitle}</span>}
                </span>
            </button>
        </li>
    );
}

function EventBox({ ev, color, onSelect }) {
    return (
        <button
            type="button"
            className="tsm-box"
            style={color ? { background: `${color}22`, borderColor: `${color}55` } : undefined}
            onClick={() => onSelect(ev)}
            title={ev.subtitle ? `${ev.title} — ${ev.subtitle}` : ev.title}
        >
            <span className="tsm-box-time" style={color ? { color } : undefined}>
                {ev.eventTime}
            </span>
            <span className="tsm-box-title">{ev.title}</span>
        </button>
    );
}

function DaySection({
    variant, // "today" | "tomorrow"
    label,
    dateStr,
    dateNames,
    events,
    tagsById,
    emptyText,
    nowHHMM, // today only; null for tomorrow
    onSelect,
}) {
    const isToday = variant === "today";
    // Tomorrow with several events becomes a grid of boxes; a single one stays a small row.
    const asGrid = !isToday && events.length > 1;
    // First event that hasn't started yet is flagged as "next" (today only).
    const nextId = isToday ? events.find((ev) => ev.eventTime >= nowHHMM)?.id : null;

    return (
        <section className={`tsm-section tsm-section--${variant}`}>
            <div className="tsm-section-head">
                <span className="tsm-section-label">{label}</span>
                <span className="tsm-section-date">{formatDisplayDate(dateStr, dateNames)}</span>
            </div>

            <div className="tsm-scroll">
                {events.length === 0 ? (
                    <p className="tsm-empty">{emptyText}</p>
                ) : asGrid ? (
                    <div className="tsm-grid">
                        {events.map((ev) => (
                            <EventBox
                                key={ev.id}
                                ev={ev}
                                color={getEventColor(ev, tagsById)}
                                onSelect={onSelect}
                            />
                        ))}
                    </div>
                ) : (
                    <ul className="tsm-list">
                        {events.map((ev) => (
                            <EventRow
                                key={ev.id}
                                ev={ev}
                                color={getEventColor(ev, tagsById)}
                                size={isToday ? "large" : "small"}
                                isPast={isToday && ev.eventTime < nowHHMM}
                                isNext={ev.id === nextId}
                                onSelect={onSelect}
                            />
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}

export default function TodayScheduleModule({ module }) {
    const header = useHeaderCollapse(module);
    const lang = useLanguage();
    const t = lang.modules.todaySchedule;
    const { user } = useAuth();

    const now = useNow();
    const todayStr = formatDateStr(now);
    const tomorrowStr = useMemo(() => {
        const d = new Date(now);
        d.setDate(d.getDate() + 1);
        return formatDateStr(d);
        // Only the calendar day matters, not the tick.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [todayStr]);

    // Fetch by explicit local dates via /range rather than /today: the backend's
    // /today derives its date from UTC, which is "yesterday" in JST before 09:00.
    const range = useMemo(() => ({ start: todayStr, end: tomorrowStr }), [todayStr, tomorrowStr]);
    const { events, isLoading, error, reload, updateEvent, deleteEvent } = useSchedule({
        scope: "range",
        range,
        live: true,
    });

    const { tags } = useScheduleTags();
    const tagsById = useMemo(() => Object.fromEntries(tags.map((tag) => [tag.id, tag])), [tags]);

    // The live hook pushes every created/updated event regardless of scope,
    // so filter to exactly the two days we display.
    const { todayEvents, tomorrowEvents } = useMemo(() => {
        const byTime = (a, b) => a.eventTime.localeCompare(b.eventTime);
        return {
            todayEvents: events.filter((e) => e.eventDate === todayStr).sort(byTime),
            tomorrowEvents: events.filter((e) => e.eventDate === tomorrowStr).sort(byTime),
        };
    }, [events, todayStr, tomorrowStr]);

    // ---- Detail / edit flow (same windows and rules as the Schedule module) ----
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [formState, setFormState] = useState(null);

    const closeDetail = () => setSelectedEvent(null);
    const closeForm = () => setFormState(null);

    const openEditForm = () => {
        if (!selectedEvent) return;
        setFormState({
            mode: "edit",
            editingId: selectedEvent.id,
            authorName: selectedEvent.author,
            initialValues: {
                title: selectedEvent.title,
                subtitle: selectedEvent.subtitle || "",
                description: selectedEvent.description || "",
                eventDate: selectedEvent.eventDate,
                eventTime: selectedEvent.eventTime,
                tags: selectedEvent.tags || [],
            },
        });
        setSelectedEvent(null);
    };

    const handleFormSubmit = async (values) => {
        try {
            await updateEvent(formState.editingId, values);
            closeForm();
        } catch (err) {
            console.error("[TodayScheduleModule] Save failed:", err);
        }
    };

    const handleDetailDelete = async () => {
        if (!selectedEvent) return;
        if (!window.confirm(lang.modules.schedule.detail.confirmDelete)) return;
        try {
            await deleteEvent(selectedEvent.id);
            closeDetail();
        } catch (err) {
            console.error("[TodayScheduleModule] Delete failed:", err);
        }
    };

    const handleFormDelete = async () => {
        if (!formState?.editingId) return;
        await deleteEvent(formState.editingId);
        closeForm();
    };

    return (
        <div className="sch-card">
            <div className="sch-glow sch-glow-top" />

            <CollapsibleHeader collapsed={header.collapsed} onToggle={header.toggle}>
                <div className="sch-header">
                    <div className="sch-header-left">
                        <div className="sch-header-icon">
                            <CalendarClock className="icon-sm" />
                        </div>
                        <div>
                            <h3 className="sch-header-title">{t.header.title}</h3>
                        </div>
                    </div>
                </div>
            </CollapsibleHeader>

            <div className="sch-body">
                {isLoading ? (
                    <div className="sch-empty-state">
                        <RefreshCw className="icon-sm sch-spin" />
                        <p className="sch-empty-text">{t.status.loading}</p>
                    </div>
                ) : error ? (
                    <div className="sch-empty-state">
                        <AlertCircle className="icon-sm sch-error-text" />
                        <p className="sch-empty-title sch-error-text">{t.status.errorTitle}</p>
                        <p className="sch-empty-text">{error}</p>
                        <button className="sch-btn-secondary" onClick={reload}>
                            {t.status.retry}
                        </button>
                    </div>
                ) : (
                    <div
                        className={`tsm-sections${
                            tomorrowEvents.length === 0 ? " tsm-sections--tomorrow-empty" : ""
                        }`}
                    >
                        <DaySection
                            variant="today"
                            label={t.today}
                            dateStr={todayStr}
                            dateNames={lang.dateNames}
                            events={todayEvents}
                            tagsById={tagsById}
                            emptyText={t.emptyToday}
                            nowHHMM={formatHHMM(now)}
                            onSelect={setSelectedEvent}
                        />
                        <DaySection
                            variant="tomorrow"
                            label={t.tomorrow}
                            dateStr={tomorrowStr}
                            dateNames={lang.dateNames}
                            events={tomorrowEvents}
                            tagsById={tagsById}
                            emptyText={t.emptyTomorrow}
                            nowHHMM={null}
                            onSelect={setSelectedEvent}
                        />
                    </div>
                )}
            </div>

            {selectedEvent && (
                <ScheduleDetailModal
                    event={selectedEvent}
                    currentUser={user}
                    tagsById={tagsById}
                    onClose={closeDetail}
                    onEdit={openEditForm}
                    onDelete={handleDetailDelete}
                />
            )}

            {formState && (
                <ScheduleEventFormModal
                    mode={formState.mode}
                    initialValues={formState.initialValues}
                    authorName={formState.authorName}
                    tags={tags}
                    onClose={closeForm}
                    onSubmit={handleFormSubmit}
                    onDelete={handleFormDelete}
                />
            )}
        </div>
    );
}
