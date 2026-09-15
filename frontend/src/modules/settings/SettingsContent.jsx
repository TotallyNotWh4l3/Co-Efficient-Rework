// ===================================================
// ファイル名: SettingsContent.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 
// ===================================================


import { useMemo } from "react";

import "./settings-content.css";

import InterfaceSettings from "./pages/InterfaceSettings";
import ModuleSettings from "./pages/ModuleSettings";
import DashboardSettings from "./pages/DashboardSettings";
import AboutSettings from "./pages/AboutSettings";
import UserManagementSettings from "../users/UserManagementSettings";

const PAGE_COMPONENTS = {
    interface: InterfaceSettings,
    modules: ModuleSettings,
    dashboard: DashboardSettings,
    users: UserManagementSettings,
    about: AboutSettings,
};

export default function SettingsContent({ currentPage }) {
    const CurrentPage = PAGE_COMPONENTS[currentPage];

    return (
        <main className="settings__content">
            {CurrentPage ? (
                <CurrentPage />
            ) : (
                <div className="settings-content__empty">
                    <p>Unable to load settings content.</p>
                </div>
            )}
        </main>
    );
}
