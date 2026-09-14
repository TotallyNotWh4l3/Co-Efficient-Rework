// ===================================================
// ファイル名: useAnnouncements.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: お知らせフック
// ===================================================


import { useState, useEffect, useCallback } from "react";
import announcementService from "../services/announcementService";

const POLL_INTERVAL_MS = 45000;

export default function useAnnouncements({ recentOnly = true, live = true } = {}) {
    const [announcements, setAnnouncements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

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

    // Polling replaces the old SSE-based live sync (removed to avoid holding
    // long-lived connections open on free-tier hosting, which was causing
    // the backend to degrade under sustained load). Re-fetches the full
    // list on an interval instead of listening for individual item events.
    // silent: true so a background refresh doesn't flip isLoading and
    // flash the list back to its loading state when nothing visibly changed.
    useEffect(() => {
        if (!live) return undefined;

        const interval = setInterval(() => {
            load({ silent: true });
        }, POLL_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [live, load]);

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
