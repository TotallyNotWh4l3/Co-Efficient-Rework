
// ===================================================
// ファイル名: ScheduleDayListModal.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: スケジュール日付リストモーダル コンポーネント
// ===================================================

import { X, Plus, ChevronRight } from "lucide-react";
import { useLanguage } from "../../../../hooks/useLanguage";
import { formatDisplayDate, getEventColor } from "../utils/scheduleHelpers";

export default function ScheduleDayListModal({
    dateStr,
    events,
    tagsById,
    onClose,
    onAdd,
    onSelectEvent,
}) {
    const lang = useLanguage();
    const t = lang.modules.schedule.dayList;

    const sorted = [...events].sort((a, b) => a.eventTime.localeCompare(b.eventTime));

    return (
        <div className="sch-overlay" onClick={onClose}>
            <div className="sch-overlay-panel" onClick={(e) => e.stopPropagation()}>
                <div className="sch-overlay-header">
                    <span className="sch-overlay-title">
                        {formatDisplayDate(dateStr, lang.dateNames)}
                    </span>
                    <button className="sch-icon-btn" onClick={onClose}>
                        <X className="icon-xs" />
                    </button>
                </div>

                <div className="sch-daylist">
                    {sorted.length === 0 ? (
                        <p className="sch-empty-text">{t.noEvents}</p>
                    ) : (
                        sorted.map((ev) => {
                            const color = getEventColor(ev, tagsById);
                            return (
                                <button
                                    key={ev.id}
                                    className="sch-daylist-row"
                                    onClick={() => onSelectEvent(ev)}
                                >
                                    {color && (
                                        <span
                                            className="sch-tag-dot"
                                            style={{ background: color }}
                                        />
                                    )}
                                    <span className="sch-daylist-time">{ev.eventTime}</span>
                                    <span className="sch-daylist-title-group">
                                        <span className="sch-daylist-title">{ev.title}</span>
                                        {ev.subtitle && (
                                            <span className="sch-daylist-subtitle">
                                                {ev.subtitle}
                                            </span>
                                        )}
                                    </span>
                                    <ChevronRight className="icon-xs sch-chevron" />
                                </button>
                            );
                        })
                    )}
                </div>

                <div className="sch-overlay-footer">
                    <button className="sch-btn-primary" onClick={() => onAdd(dateStr)}>
                        <Plus className="icon-xs" />
                        <span>{t.addEvent}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
