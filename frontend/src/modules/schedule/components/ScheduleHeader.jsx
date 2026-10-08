// ===================================================
// ファイル名: ScheduleHeader.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: スケジュールヘッダー コンポーネント
// ===================================================

import { Calendar, Plus, Tags } from "lucide-react";
import { useLanguage } from "../../settings/useLanguage";

export default function ScheduleHeader({
    onAdd,
    onManageTags,
    canManageTags,
}) {
    const lang = useLanguage();
    const t = lang.modules.schedule.header;

    return (
        <div className="sch-header">
            <div className="sch-header-left">
                <div className="sch-header-icon">
                    <Calendar className="icon-sm" />
                </div>
                <div>
                    <h3 className="sch-header-title">{t.title}</h3>
                </div>
            </div>
            <div className="sch-header-actions">
                {canManageTags && (
                    <button className="sch-icon-toggle" onClick={onManageTags} title={t.manageTags}>
                        <Tags className="icon-xs" />
                    </button>
                )}
                <button className="sch-btn-primary" onClick={onAdd}>
                    <Plus className="icon-xs" />
                    <span>{t.addEvent}</span>
                </button>
            </div>
        </div>
    );
}
