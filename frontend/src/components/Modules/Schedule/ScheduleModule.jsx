// ===================================================
// ファイル名: ScheduleModule.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: スケジュールモジュール コンポーネント
// ===================================================

import React, { useState, useMemo } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import useSchedule from "../../../hooks/useSchedule";
import useScheduleTags from "../../../hooks/useScheduleTags";
import { useDashboard } from "../../../hooks/useDashboard";
import { useAuth } from "../../../hooks/useAuth";
import { useLanguage } from "../../../hooks/useLanguage";
import ScheduleHeader from "./components/ScheduleHeader";
import ScheduleCalendarGrid from "./components/ScheduleCalendarGrid";
import ScheduleDayListModal from "./components/ScheduleDayListModal";
import ScheduleDetailModal from "./components/ScheduleDetailModal";
import ScheduleEventFormModal from "./components/ScheduleEventFormModal";
import ScheduleTagManagerModal from "./components/ScheduleTagManagerModal";
import ScheduleSettingsPanel from "./components/ScheduleSettingsPanel";
import ScheduleFooter from "./components/ScheduleFooter";
import {
    formatDateStr,
    getRelativeRollingDays,
    getRelativeWeekDays,
} from "./utils/scheduleHelpers";

import "./schedule-module.css";

export default function ScheduleModule({ module }) {
    const { removeModule } = useDashboard();
    const { user } = useAuth();
    const lang = useLanguage();
    const t = lang.modules.schedule;
    const onRemove = () => removeModule(module.id);
    const isAdmin = user?.role?.toLowerCase() === "admin";

    // ---- View mode state ----
    const [viewMode, setViewMode] = useState("absolute"); // 'absolute' | 'relative'
    const [layout, setLayout] = useState("month"); // 'month' | 'week'
    const [anchorDate, setAnchorDate] = useState(new Date());
    const [daysBefore, setDaysBefore] = useState(0);
    const [showRelativeSettings, setShowRelativeSettings] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Relative view fetches a bounded range instead of the whole table.
    const relativeDays = useMemo(() => getRelativeRollingDays(daysBefore), [daysBefore]);
    const relativeWeekDays = useMemo(() => getRelativeWeekDays(daysBefore), [daysBefore]);
    const relativeRange = useMemo(() => {
        const activeDays = layout === "week" ? relativeWeekDays : relativeDays;
        return {
            start: formatDateStr(activeDays[0]),
            end: formatDateStr(activeDays[activeDays.length - 1]),
        };
    }, [layout, relativeDays, relativeWeekDays]);

    const { events, isLoading, error, reload, createEvent, updateEvent, deleteEvent } = useSchedule(
        viewMode === "relative"
            ? { scope: "range", range: relativeRange, live: true }
            : { scope: "all", live: true },
    );

    const { tags, upsertTag, removeTag } = useScheduleTags();
    const tagsById = useMemo(() => Object.fromEntries(tags.map((t) => [t.id, t])), [tags]);

    // ---- Modal state ----
    const [dayListDate, setDayListDate] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [formState, setFormState] = useState(null);
    const [showTagManager, setShowTagManager] = useState(false);

    const todayStr = formatDateStr(new Date());

    const eventsByDay = useMemo(() => {
        const map = {};
        for (const ev of events) {
            if (!map[ev.eventDate]) map[ev.eventDate] = [];
            map[ev.eventDate].push(ev);
        }
        return map;
    }, [events]);

    // ---- Navigation (Absolute view only — Relative view is always "today-centered") ----
    const goPrev = () => {
        const next = new Date(anchorDate);
        if (layout === "week") next.setDate(anchorDate.getDate() - 7);
        else next.setMonth(anchorDate.getMonth() - 1);
        setAnchorDate(next);
    };
    const goNext = () => {
        const next = new Date(anchorDate);
        if (layout === "week") next.setDate(anchorDate.getDate() + 7);
        else next.setMonth(anchorDate.getMonth() + 1);
        setAnchorDate(next);
    };
    const goToday = () => setAnchorDate(new Date());

    // ---- Flow: calendar day click -> day list ----
    const openDayList = (dateStr) => setDayListDate(dateStr);
    const closeDayList = () => setDayListDate(null);

    // ---- Flow: day list row click -> detail ----
    const openDetail = (ev) => {
        setSelectedEvent(ev);
        setDayListDate(null);
    };
    const closeDetail = () => setSelectedEvent(null);

    // ---- Flow: "Add Event" -> form (add mode) ----
    const openAddForm = (dateStr) => {
        setFormState({
            mode: "add",
            initialValues: {
                title: "",
                subtitle: "",
                description: "",
                eventDate: dateStr,
                eventTime: "09:00",
                tags: [],
            },
        });
        setDayListDate(null);
    };

    // ---- Flow: detail "Edit" -> form (edit mode) ----
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
    const closeForm = () => setFormState(null);

    // ---- CRUD handlers ----
    const handleFormSubmit = async (values) => {
        try {
            if (formState.mode === "edit") {
                await updateEvent(formState.editingId, values);
            } else {
                await createEvent(values);
            }
            closeForm();
        } catch (err) {
            console.error("[ScheduleModule] Save failed:", err);
        }
    };

    const handleDetailDelete = async () => {
        if (!selectedEvent) return;
        if (!window.confirm(t.detail.confirmDelete)) return;
        try {
            await deleteEvent(selectedEvent.id);
            closeDetail();
        } catch (err) {
            console.error("[ScheduleModule] Delete failed:", err);
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

            <ScheduleHeader
                onOpenSettings={() => setShowSettings(true)}
                onAdd={() => openAddForm(todayStr)}
                onManageTags={() => setShowTagManager(true)}
                isAdmin={isAdmin}
                onRemove={onRemove}
            />

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
                ) : viewMode === "relative" ? (
                    <ScheduleCalendarGrid
                        anchorDate={new Date()}
                        layout={layout}
                        days={layout === "week" ? relativeWeekDays : relativeDays}
                        onPrev={() => {}}
                        onNext={() => {}}
                        onToday={() => {}}
                        eventsByDay={eventsByDay}
                        tagsById={tagsById}
                        onDayClick={openDayList}
                        hideNav
                    />
                ) : (
                    <ScheduleCalendarGrid
                        anchorDate={anchorDate}
                        layout={layout}
                        onPrev={goPrev}
                        onNext={goNext}
                        onToday={goToday}
                        eventsByDay={eventsByDay}
                        tagsById={tagsById}
                        onDayClick={openDayList}
                    />
                )}
            </div>

            <ScheduleFooter />

            {dayListDate && (
                <ScheduleDayListModal
                    dateStr={dayListDate}
                    events={eventsByDay[dayListDate] || []}
                    tagsById={tagsById}
                    onClose={closeDayList}
                    onAdd={openAddForm}
                    onSelectEvent={openDetail}
                />
            )}

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
                    onDelete={formState.mode === "edit" ? handleFormDelete : undefined}
                />
            )}

            {showTagManager && (
                <ScheduleTagManagerModal
                    tags={tags}
                    onClose={() => setShowTagManager(false)}
                    onUpsert={upsertTag}
                    onRemove={removeTag}
                />
            )}

            {showRelativeSettings && (
                <ScheduleRelativeSettings
                    daysBefore={daysBefore}
                    layout={layout}
                    onChange={setDaysBefore}
                    onClose={() => setShowRelativeSettings(false)}
                />
            )}

            {showSettings && (
                <ScheduleSettingsPanel
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    layout={layout}
                    onLayoutChange={setLayout}
                    daysBefore={daysBefore}
                    onDaysBeforeChange={setDaysBefore}
                    onClose={() => setShowSettings(false)}
                />
            )}
        </div>
    );
}
