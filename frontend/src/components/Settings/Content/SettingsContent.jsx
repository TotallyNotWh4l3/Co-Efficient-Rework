// ===================================================
// ファイル名: SettingsContent.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 
// ===================================================


import { useMemo } from "react";

import "./settings-content.css";

import InterfaceSettings from "../Pages/InterfaceSettings";
import ModuleSettings from "../Pages/ModuleSettings";
import DashboardSettings from "../Pages/DashboardSettings";
import AboutSettings from "../Pages/AboutSettings";
import UserManagementSettings from "../Pages/UserManagementSettings";

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
