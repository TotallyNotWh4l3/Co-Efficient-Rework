// ===================================================
// ファイル名: Dashboard.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ダッシュボードコンポーネント
// ===================================================


import { useState } from "react";

import DashboardHeader from "./DashboardHeader";
import DashboardWorkspace from "./DashboardWorkspace";

import Settings from "../Settings/Settings";

import "./dashboard.css";
import { useLocation } from "../../hooks/useLocation";

export default function Dashboard() {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isSettingsClosing, setIsSettingsClosing] = useState(false);

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

    return (
        <div className="dashboard">
            <DashboardHeader setIsSettingsOpen={setIsSettingsOpen} />

            <DashboardWorkspace />

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
