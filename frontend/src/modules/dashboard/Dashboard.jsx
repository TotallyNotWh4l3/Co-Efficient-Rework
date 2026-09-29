// ===================================================
// ファイル名: Dashboard.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ダッシュボードコンポーネント
// ===================================================

import { useState } from "react";

import DashboardWorkspace from "./DashboardWorkspace";
import Sidebar from "../sidebar/Sidebar";
import PlaceholderPage from "../sidebar/PlaceholderPage";
import { useSidebar } from "../sidebar/useSidebar";

import Settings from "../settings/Settings";
import { useAuth } from "../auth/useAuth";

import "./dashboard.css";
import { useLocation } from "../locations/useLocation";

export default function Dashboard() {
    const { user } = useAuth();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isSettingsClosing, setIsSettingsClosing] = useState(false);
    const [activeSection, setActiveSection] = useState("dashboard");

    const sidebar = useSidebar(user);

    const closeSettings = () => {
        setIsSettingsClosing(true);

        setTimeout(() => {
            setIsSettingsOpen(false);
            setIsSettingsClosing(false);
        }, 180);
    };

    const { requestCurrentLocation } = useLocation();

    async function handleUseCurrentLocation() {
        try {
            const coords = await requestCurrentLocation();

            console.log(coords.latitude);
            console.log(coords.longitude);

            // Later:
            // reverse geocode
            // save location
            // select as default
        } catch (error) {
            console.error(error);
        }
    }

    // Selecting a section closes the (floating) sidebar so it doesn't sit
    // over the content the user just navigated to — but not when it's
    // locked into the layout, since then it isn't covering anything.
    const handleSelectSection = (sectionId) => {
        setActiveSection(sectionId);
        if (!sidebar.isLocked) sidebar.closeSidebar();
    };

    return (
        <div className="dashboard" style={{ "--sidebar-locked": sidebar.isLocked ? 1 : 0 }}>
            <Sidebar
                sidebar={sidebar}
                activeSection={activeSection}
                onSelectSection={handleSelectSection}
                onOpenSettings={() => setIsSettingsOpen(true)}
            />

            <div className="dashboard__content">
                {activeSection === "dashboard" ? (
                    <DashboardWorkspace />
                ) : (
                    <PlaceholderPage titleKey={activeSection} />
                )}
            </div>

            {isSettingsOpen && (
                <>
                    <div
                        className={`dashboard__overlay ${
                            isSettingsClosing ? "dashboard__overlay--closing" : ""
                        }`}
                        onClick={closeSettings}
                    />

                    <Settings onClose={closeSettings} closing={isSettingsClosing} />
                </>
            )}
        </div>
    );
}
