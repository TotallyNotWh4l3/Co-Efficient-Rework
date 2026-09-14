// ===================================================
// ファイル名: announcementConstants.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: お知らせモジュール定数
// ===================================================

import { AlertTriangle, Wrench, Star, Bell, Clipboard, Info } from "lucide-react";

export const CATEGORY_PRIORITY = [
    "urgent",
    "maintenance",
    "event",
    "announcement",
    "notice",
    "general",
];

export const CATEGORY_TABS = [
    "all",
    "urgent",
    "maintenance",
    "event",
    "announcement",
    "notice",
    "general",
];

export const CATEGORY_CONFIG = {
    urgent: { icon: AlertTriangle, className: "tag-urgent" },
    maintenance: { icon: Wrench, className: "tag-maintenance" },
    event: { icon: Star, className: "tag-event" },
    announcement: { icon: Bell, className: "tag-announcement" },
    notice: { icon: Clipboard, className: "tag-notice" },
    general: { icon: Info, className: "tag-general" },
};

export function getPrimaryCategory(categories) {
    if (!categories || !Array.isArray(categories) || categories.length === 0) return "general";
    for (const p of CATEGORY_PRIORITY) {
        if (categories.includes(p)) return p;
    }
    return categories[0] || "general";
}

/**
 * Relative time if < 3 days old, otherwise the plain date — per spec.
 * `time` is lang.modules.announcement.time from en.js/ja.js, e.g.
 * { justNow, minutesAgo, hoursAgo, daysAgo }.
 * `locale` (e.g. "en" | "ja") controls word order, since Japanese suffixes
 * the unit directly onto the number with no space ("3日前") while English
 * puts a space before the unit ("3d ago").
 */
export function formatTimestamp(isoDate, time, locale) {
    const then = new Date(isoDate);
    const now = new Date();
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    const join = (n, unit) => (locale === "ja" ? `${n}${unit}` : `${n} ${unit}`);

    if (diffDays >= 3) {
        return then.toISOString().split("T")[0];
    }
    if (diffDays >= 1) {
        return join(diffDays, time.daysAgo);
    }
    if (diffHours >= 1) {
        return join(diffHours, time.hoursAgo);
    }
    if (diffMins >= 1) {
        return join(diffMins, time.minutesAgo);
    }
    return time.justNow;
}
