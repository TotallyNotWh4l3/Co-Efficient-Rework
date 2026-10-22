import { Monitor, Blocks, LayoutDashboard, CircleHelp, Users } from "lucide-react";

// Page titles live in en.js / ja.js under settings.sidebar[page.id].
export const SETTINGS_PAGES = [
    {
        id: "interface",
        icon: Monitor,
    },

    {
        id: "modules",
        icon: Blocks,
    },

    {
        id: "dashboard",
        icon: LayoutDashboard,
    },

    {
        id: "users",
        icon: Users,
        adminOnly: true,
    },

    {
        id: "about",
        icon: CircleHelp,
    },
];

export const LANGUAGE_OPTIONS = [
    {
        id: "en",
        label: "English",
    },

    {
        id: "ja",
        label: "日本語",
    },
];
