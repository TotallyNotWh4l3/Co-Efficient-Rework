// ===================================================
// ファイル名: useAnnouncements.js
// 概要: お知らせフック
//       旧: 45秒ごとのポーリングだったものを廃止し、バックエンドが
//       central SSEController経由で配信する
//       announcements:created/updated/deleted/archived/restored を
//       購読する方式に変更。
// ===================================================

import { useState, useEffect, useCallback } from "react";
import announcementService from "./announcementService";
import { getSSEUrl } from "../../shared/sse/sseUrl";
import { useRealtime } from "../../shared/sse/RealtimeContext";

export default function useAnnouncements({ recentOnly = true, live = true } = {}) {
    const [announcements, setAnnouncements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const { subscribe } = useRealtime();

    const load = useCallback(
        async ({ silent = false } = {}) => {
            if (!silent) setIsLoading(true);
            setError(null);
            try {
                const data = recentOnly
                    ? await announcementService.getRecent()
                    : await announcementService.getAll();
                setAnnouncements(Array.isArray(data) ? data : []);
                if (!Array.isArray(data)) {
                    console.warn("[useAnnouncements] Expected an array, got:", data);
                }
            } catch (e) {
                setError(e.message || "Failed to load announcements.");
            } finally {
                if (!silent) setIsLoading(false);
            }
        },
        [recentOnly],
    );

    useEffect(() => {
        load();
    }, [load]);

    // Live sync via SSE. created/updated/deleted are applied directly to
    // local state for an instant, flicker-free update. archived/restored
    // change *which list* an item belongs to (recentOnly vs. the archive
    // view), so those just trigger a silent re-fetch of whatever this
    // hook is currently scoped to — still instant (SSE-triggered), just
    // not worth hand-merging since membership depends on `recentOnly`.
    useEffect(() => {
        if (!live) return undefined;

        const url = getSSEUrl();

        const unsubCreated = subscribe(url, "announcements:created", (event) => {
            const created = JSON.parse(event.data);
            setAnnouncements((prev) => {
                const list = Array.isArray(prev) ? prev : [];
                if (list.some((a) => a.id === created.id)) return list;
                return [created, ...list];
            });
        });

        const unsubUpdated = subscribe(url, "announcements:updated", (event) => {
            const updated = JSON.parse(event.data);
            setAnnouncements((prev) =>
                (Array.isArray(prev) ? prev : []).map((a) => (a.id === updated.id ? updated : a)),
            );
        });

        const unsubDeleted = subscribe(url, "announcements:deleted", (event) => {
            const deleted = JSON.parse(event.data);
            setAnnouncements((prev) =>
                (Array.isArray(prev) ? prev : []).filter((a) => a.id !== deleted.id),
            );
        });

        const unsubArchived = subscribe(url, "announcements:archived", () => {
            load({ silent: true });
        });

        const unsubRestored = subscribe(url, "announcements:restored", () => {
            load({ silent: true });
        });

        return () => {
            unsubCreated();
            unsubUpdated();
            unsubDeleted();
            unsubArchived();
            unsubRestored();
        };
    }, [live, load, subscribe]);

    const createAnnouncement = useCallback(async (payload) => {
        const created = await announcementService.create(payload);
        setAnnouncements((prev) => {
            const list = Array.isArray(prev) ? prev : [];
            if (list.some((a) => a.id === created.id)) return list;
            return [created, ...list];
        });
        return created;
    }, []);

    const updateAnnouncement = useCallback(async (id, payload) => {
        const updated = await announcementService.update(id, payload);
        setAnnouncements((prev) =>
            (Array.isArray(prev) ? prev : []).map((a) => (a.id === id ? updated : a)),
        );
        return updated;
    }, []);

    const deleteAnnouncement = useCallback(async (id) => {
        await announcementService.remove(id);
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    }, []);

    const markAsRead = useCallback(async (id) => {
        setAnnouncements((prev) =>
            (Array.isArray(prev) ? prev : []).map((a) =>
                a.id === id ? { ...a, isRead: true } : a,
            ),
        );
        try {
            await announcementService.markRead(id);
        } catch (e) {
            console.error("[useAnnouncements] Failed to mark as read:", e);
        }
    }, []);

    const unreadCount = (Array.isArray(announcements) ? announcements : []).filter(
        (a) => !a.isRead,
    ).length;

    return {
        announcements,
        isLoading,
        error,
        reload: load,
        createAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        markAsRead,
        unreadCount,
    };
}
