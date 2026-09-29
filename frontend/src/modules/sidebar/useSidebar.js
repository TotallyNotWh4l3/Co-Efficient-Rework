// ===================================================
// ファイル名: useSidebar.js
// 作成日: 2026/09/29
// 概要: サイドバー状態フック（開閉・ロック）
// ===================================================

import { useState, useEffect, useCallback } from "react";

const LOCK_STORAGE_PREFIX = "co-efficient-sidebar-locked-";

// NOTE: The lock flag is meant to live on the user's account (per-user,
// cross-device) once there's a backend field for it. Until then it's kept
// in localStorage, namespaced per user id, which still satisfies "persists
// across sessions" on this browser. Swapping this for a real API call
// later shouldn't require touching any component that uses this hook —
// only the read/write in toggleLocked below.
function readStoredLock(storageKey) {
    try {
        return localStorage.getItem(storageKey) === "1";
    } catch {
        return false;
    }
}

export function useSidebar(user) {
    // A guest (no session) and a signed-in user each get their own slot —
    // "guest" here just means "no account id available yet", not the
    // future real Guest account.
    const storageKey = `${LOCK_STORAGE_PREFIX}${user?.id ?? "guest"}`;

    // Hidden by default on every load, independent of the saved lock state.
    const [isOpen, setIsOpen] = useState(false);
    const [isLocked, setIsLocked] = useState(() => readStoredLock(storageKey));

    // The lock is per-user, so re-sync it whenever the signed-in user
    // changes (e.g. logging out then back in as someone else).
    useEffect(() => {
        setIsLocked(readStoredLock(storageKey));
    }, [storageKey]);

    const toggleOpen = useCallback(() => setIsOpen((prev) => !prev), []);
    const closeSidebar = useCallback(() => setIsOpen(false), []);

    const toggleLocked = useCallback(() => {
        setIsLocked((prev) => {
            const next = !prev;
            try {
                localStorage.setItem(storageKey, next ? "1" : "0");
            } catch {
                // Storage unavailable (private browsing, quota, etc.) —
                // the lock still applies for this session, it just won't
                // survive a reload.
            }
            return next;
        });
    }, [storageKey]);

    return { isOpen, toggleOpen, closeSidebar, isLocked, toggleLocked };
}
