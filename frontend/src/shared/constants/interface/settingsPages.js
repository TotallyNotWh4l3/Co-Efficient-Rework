// ===================================================
// ファイル名: settingsPages.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 設定ページオプション
// ===================================================

import { Monitor, Blocks, LayoutDashboard, CircleHelp, Users } from "lucide-react";

export const SETTINGS_PAGES = [
    {
        id: "interface",
        title: "Interface",
        icon: Monitor,
    },

    {
        id: "modules",
        title: "Modules",
        icon: Blocks,
    },

    {
        id: "dashboard",
        title: "Dashboard",
        icon: LayoutDashboard,
    },

    {
        id: "users",
        title: "User Management",
        icon: Users,
        adminOnly: true,
    },

    {
        id: "about",
        title: "About",
        icon: CircleHelp,
    },
];
