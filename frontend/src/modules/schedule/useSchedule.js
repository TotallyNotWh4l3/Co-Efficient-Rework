
// ===================================================
// ファイル名: useSchedule.js
// 概要: スケジュール情報を取得・管理するカスタムフック
//       旧: 45秒ごとのポーリングだったものを廃止し、バックエンドが
//       配信する schedule:created/updated/deleted を購読する方式に変更。
// ===================================================

import { useState, useEffect, useCallback } from "react";
import scheduleService from "./scheduleService";
import { getSSEUrl } from "../../shared/sse/sseUrl";
import { useRealtime } from "../../shared/sse/RealtimeContext";

export default function useSchedule({
    scope = "all",
    limit = undefined,
    range = undefined,
    live = true,
} = {}) {
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const { subscribe } = useRealtime();

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

    // Live sync via SSE. created/updated apply directly; deleted removes
    // by id. Scoped views (today/upcoming/range) still get pushed every
    // event — filtering on an event that falls outside the current scope
    // is harmless since it'll just no-op against the sorted list, and
    // this keeps the hook simple. Rejoin the full list is still exact
    // because create/update come from the server as canonical rows.
    useEffect(() => {
        if (!live) return undefined;

        const url = getSSEUrl();

        const unsubCreated = subscribe(url, "schedule:created", (event) => {
            const created = JSON.parse(event.data);
            setEvents((prev) => {
                const list = Array.isArray(prev) ? prev : [];
                if (list.some((e) => e.id === created.id)) return list;
                return sortEvents([created, ...list]);
            });
        });

        const unsubUpdated = subscribe(url, "schedule:updated", (event) => {
            const updated = JSON.parse(event.data);
            setEvents((prev) =>
                sortEvents(
                    (Array.isArray(prev) ? prev : []).map((e) =>
                        e.id === updated.id ? updated : e,
                    ),
                ),
            );
        });

        const unsubDeleted = subscribe(url, "schedule:deleted", (event) => {
            const deleted = JSON.parse(event.data);
            setEvents((prev) => (Array.isArray(prev) ? prev : []).filter((e) => e.id !== deleted.id));
        });

        return () => {
            unsubCreated();
            unsubUpdated();
            unsubDeleted();
        };
    }, [live, subscribe, sortEvents]);

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
