// ===================================================
// ファイル名: Settings.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 設定コンポーネント
// ===================================================

import { useState } from "react";

import "./settings.css";

import { SETTINGS_PAGES } from "../../constants/interface";
import { useAuth } from "../../hooks/useAuth";

import SettingsSidebar from "./Sidebar/SettingsSidebar";
import SettingsContent from "./Content/SettingsContent";
import { X } from "lucide-react";

export default function Settings({ onClose, closing }) {
    const [currentPage, setCurrentPage] = useState(SETTINGS_PAGES[0].id);
    const { user } = useAuth();
    const isAdmin = user?.role?.toLowerCase() === "admin";

    return (
        <div className={`settings ${closing ? "settings--closing" : ""}`}>
            <button
                className="settings__close-button"
                type="button"
                aria-label="Close Settings"
                onClick={onClose}
            >
                <X />
            </button>

            <SettingsSidebar
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                isAdmin={isAdmin}
            />

            <SettingsContent currentPage={currentPage} />
        </div>
    );
}
