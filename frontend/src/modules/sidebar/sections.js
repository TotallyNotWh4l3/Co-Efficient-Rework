// ===================================================
// ファイル名: sections.js
// 作成日: 2026/09/29
// 概要: サイドバーのナビゲーションセクション定義
// ===================================================

import { LayoutGrid, ClipboardCheck } from "lucide-react";

// Central registry the sidebar renders buttons from. Adding a future
// section (e.g. Poll/Survey) should only mean adding an entry here.
//
// - roles: null means visible to every account, including a signed-out
//   session. A non-null array restricts the button to those roles
//   (matching the isManagerOrAdmin-style checks used elsewhere, e.g.
//   Schedule's tag manager).
// - comingSoon: true renders the button but routes to a placeholder page
//   instead of real content, for sections that don't exist yet.
export const SIDEBAR_SECTIONS = [
    {
        id: "dashboard",
        icon: LayoutGrid,
        roles: null,
        comingSoon: false,
    },
    {
        id: "attendance",
        icon: ClipboardCheck,
        roles: null,
        comingSoon: true,
    },
];

export function getVisibleSections(user) {
    const role = user?.role?.toLowerCase();
    return SIDEBAR_SECTIONS.filter(
        (section) => !section.roles || (role && section.roles.includes(role)),
    );
}
