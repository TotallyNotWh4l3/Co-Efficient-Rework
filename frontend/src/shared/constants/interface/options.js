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
