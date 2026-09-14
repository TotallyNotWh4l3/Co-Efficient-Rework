// ===================================================
// ファイル名: ScheduleHeader.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: スケジュールヘッダー コンポーネント
// ===================================================

import { Calendar, Plus, X, Tags, Settings } from "lucide-react";
import { useLanguage } from "../../../../hooks/useLanguage";

export default function ScheduleHeader({ onOpenSettings, onAdd, onManageTags, isAdmin, onRemove }) {
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
                <button className="sch-icon-toggle" onClick={onOpenSettings} title={t.settings}>
                    <Settings className="icon-xs" />
                </button>
                {isAdmin && (
                    <button className="sch-icon-toggle" onClick={onManageTags} title={t.manageTags}>
                        <Tags className="icon-xs" />
                    </button>
                )}
                <button className="sch-btn-primary" onClick={onAdd}>
                    <Plus className="icon-xs" />
                    <span>{t.addEvent}</span>
                </button>
                {onRemove && (
                    <button className="sch-icon-toggle" onClick={onRemove} title={t.removeModule}>
                        <X className="icon-xs" />
                    </button>
                )}
            </div>
        </div>
    );
}
