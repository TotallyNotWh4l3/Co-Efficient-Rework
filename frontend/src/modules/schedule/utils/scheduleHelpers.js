// ===================================================
// ファイル名: scheduleHelpers.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: スケジュールヘルパー関数
// ===================================================

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const ROLE_RANK = { user: 0, manager: 1, admin: 2 };

/** Admin edits everyone's; manager edits managers-below (i.e. users); everyone edits their own. */
export function canModify(actor, event) {
    if (!actor) return false;
    const actorRank = ROLE_RANK[actor.role?.toLowerCase()] ?? 0;
    const eventRank = ROLE_RANK[event.authorRole?.toLowerCase()] ?? 0;
    return actorRank > eventRank || event.authorId === actor.id;
}

export function formatDateStr(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

export function getMonthGridDays(anchorDate) {
    const year = anchorDate.getFullYear();
    const month = anchorDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    for (let i = 0; i < 42; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        days.push(d);
    }
    return days;
}

/** 'YYYY-MM-DD' -> "Thursday, August 14" */
export function formatDisplayDate(dateStr, dateNames) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);

    const weekday = dateNames.weekdaysLong[date.getDay()];
    const month = dateNames.monthsLong[date.getMonth()];

    return `${weekday}, ${month} ${date.getDate()}`;
}

export function getWeekDays(anchorDate) {
    const dayOfWeek = anchorDate.getDay();
    const startOfWeek = new Date(anchorDate);
    startOfWeek.setDate(anchorDate.getDate() - dayOfWeek);

    const days = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        days.push(d);
    }
    return days;
}

/** Rolling window centered on today: `daysBefore` days back through `30 - daysBefore` days ahead. */
export function getRelativeRollingDays(daysBefore = 0) {
    const today = new Date();
    const days = [];
    const startOffset = -daysBefore;
    for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + startOffset + i);
        days.push(d);
    }
    return days;
}

// A real scheduling clash: two or more events at the exact same time on
// the same day. (Events here are single points in time — no duration/end
// field — so "overlap" means an identical eventTime, not just sharing a
// day. Checking dayEvents.length > 1 alone meant any two events on the
// same day showed the conflict badge forever, even after editing one to
// a non-clashing time.)
export function hasConflict(dayEvents) {
    if (dayEvents.length < 2) return false;
    const seen = new Set();
    for (const ev of dayEvents) {
        if (seen.has(ev.eventTime)) return true;
        seen.add(ev.eventTime);
    }
    return false;
}

/** First tag in the event's tag list determines display color; falls back to accent. */
export function getEventColor(event, tagsById) {
    if (!event.tags || event.tags.length === 0) return null;
    const firstTag = tagsById[event.tags[0]];
    return firstTag?.color || null;
}

export function getRelativeWeekDays(daysBefore = 0) {
    const today = new Date();
    const days = [];
    const startOffset = -daysBefore;
    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + startOffset + i);
        days.push(d);
    }
    return days;
}