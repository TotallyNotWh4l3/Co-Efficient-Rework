// ===================================================
// ファイル名: DashboardHeader.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ダッシュボードヘッダーコンポーネント
// ===================================================

import { Layers } from "lucide-react";
import LinearGradient from "../common/LinearGradient";

// Components
import SettingsButton from "./Buttons/SettingsButton";
import UserButton from "./Buttons/UserButton";

// JS
import { useLanguage } from "../../hooks/useLanguage";

// CSS
import "./dashboard-header.css";

function Workmark() {
    const T = useLanguage();
    const titleGradient = ["to right", "#4c00ff, #9c31ff"];

    return (
        <div className="dashboard-header__wordmark">
            <Layers />
            <div className="dashboard-header__titles">
                <span className="dashboard-header__title">
                    <LinearGradient gradient={titleGradient}>
                        {T.dashboard.header.title.toUpperCase()}
                    </LinearGradient>
                </span>
                <span className="dashboard-header__subtitle">
                    <LinearGradient gradient={titleGradient}>
                        {T.dashboard.header.subTitle.toUpperCase()}
                    </LinearGradient>
                </span>
            </div>
        </div>
    );
}

export default function DashboardHeader({ setIsSettingsOpen }) {
    return (
        <header className="dashboard-header">
            <Workmark />

            <div className="dashboard-header__buttons">
                <SettingsButton setIsOpen={setIsSettingsOpen} />
                <UserButton />
            </div>
        </header>
    );
}
