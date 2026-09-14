
// ===================================================
// ファイル名: useSchedule.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: スケジュール情報を取得・管理するカスタムフック
// ===================================================

import { useState, useEffect, useCallback } from "react";
import scheduleService from "../services/scheduleService";

const POLL_INTERVAL_MS = 45000;

export default function useSchedule({
    scope = "all",
    limit = undefined,
    range = undefined,
    live = true,
} = {}) {
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(
        async ({ silent = false } = {}) => {
            if (!silent) setIsLoading(true);
            setError(null);
            try {
                let data;
                if (scope === "today") {
                    data = await scheduleService.getToday();
                } else if (scope === "upcoming") {
                    data = await scheduleService.getUpcoming(limit);
                } else if (scope === "range" && range?.start && range?.end) {
                    data = await scheduleService.getRange(range.start, range.end);
                } else {
                    data = await scheduleService.getAll();
                }
                setEvents(Array.isArray(data) ? data : []);
                if (!Array.isArray(data)) {
                    console.warn("[useSchedule] Expected an array, got:", data);
                }
            } catch (e) {
                setError(e.message || "Failed to load schedule.");
            } finally {
                if (!silent) setIsLoading(false);
            }
        },
        [scope, limit, range?.start, range?.end],
    );

    useEffect(() => {
        load();
    }, [load]);

    const sortEvents = useCallback(
        (list) =>
            [...list].sort((a, b) => {
                const aKey = `${a.eventDate}T${a.eventTime}`;
                const bKey = `${b.eventDate}T${b.eventTime}`;
                return aKey.localeCompare(bKey);
            }),
        [],
    );

    // Polling replaces the old SSE-based live sync (removed to avoid holding
    // long-lived connections open on free-tier hosting). Re-fetches the
    // current scope's list wholesale on an interval. silent: true so a
    // background refresh doesn't flip isLoading and flash the list back to
    // its loading state when nothing visibly changed.
    useEffect(() => {
        if (!live) return undefined;

        const interval = setInterval(() => {
            load({ silent: true });
        }, POLL_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [live, load]);

    const createEvent = useCallback(
        async (payload) => {
            const created = await scheduleService.create(payload);
            setEvents((prev) => {
                const list = Array.isArray(prev) ? prev : [];
                if (list.some((e) => e.id === created.id)) return list;
                return sortEvents([created, ...list]);
            });
            return created;
        },
        [sortEvents],
    );

    const updateEvent = useCallback(
        async (id, payload) => {
            const updated = await scheduleService.update(id, payload);
            setEvents((prev) =>
                sortEvents(
                    (Array.isArray(prev) ? prev : []).map((e) => (e.id === id ? updated : e)),
                ),
            );
            return updated;
        },
        [sortEvents],
    );

    const deleteEvent = useCallback(async (id) => {
        await scheduleService.remove(id);
        setEvents((prev) => prev.filter((e) => e.id !== id));
    }, []);

    return { events, isLoading, error, reload: load, createEvent, updateEvent, deleteEvent };
}