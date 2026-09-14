// ===================================================
// ファイル名: ScheduleViewToggle.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: スケジュールビュー切り替え コンポーネント
// ===================================================

import { Calendar, Clock } from "lucide-react";
import { useLanguage } from "../../../../hooks/useLanguage";

export default function ScheduleViewToggle({ viewMode, onChange }) {
    const lang = useLanguage();
    const t = lang.modules.schedule.viewToggle;

    return (
        <div className="sch-view-toggle">
            <button
                className={`sch-view-toggle-btn${viewMode === "absolute" ? " active" : ""}`}
                onClick={() => onChange("absolute")}
            >
                <Calendar className="icon-xs" />
                <span>{t.absolute}</span>
            </button>
            <button
                className={`sch-view-toggle-btn${viewMode === "relative" ? " active" : ""}`}
                onClick={() => onChange("relative")}
            >
                <Clock className="icon-xs" />
                <span>{t.relative}</span>
            </button>
        </div>
    );
}
