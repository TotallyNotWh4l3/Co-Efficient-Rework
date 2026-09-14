// ===================================================
// ファイル名: ScheduleDetailModal.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: スケジュール詳細モーダル コンポーネント
// ===================================================

import { X, Clock, User, Pencil, Trash2 } from "lucide-react";
import { useLanguage } from "../../../../hooks/useLanguage";
import { canModify } from "../utils/scheduleHelpers";

export default function ScheduleDetailModal({
    event,
    currentUser,
    tagsById,
    onClose,
    onEdit,
    onDelete,
}) {
    const lang = useLanguage();
    const t = lang.modules.schedule.detail;

    const editable = canModify(currentUser, event);

    return (
        <div className="sch-overlay" onClick={onClose}>
            <div className="sch-overlay-panel" onClick={(e) => e.stopPropagation()}>
                <div className="sch-overlay-header">
                    <span className="sch-overlay-title">{t.title}</span>
                    <button className="sch-icon-btn" onClick={onClose}>
                        <X className="icon-xs" />
                    </button>
                </div>

                <div className="sch-detail-body">
                    <h4 className="sch-detail-title">{event.title}</h4>
                    {event.subtitle && <p className="sch-detail-subtitle">{event.subtitle}</p>}

                    {event.tags?.length > 0 && (
                        <div className="sch-detail-tags">
                            {event.tags.map((tagId) => {
                                const tag = tagsById[tagId];
                                return (
                                    <span
                                        key={tagId}
                                        className="sch-tag-badge"
                                        style={
                                            tag
                                                ? {
                                                      background: `${tag.color}22`,
                                                      borderColor: tag.color,
                                                      color: tag.color,
                                                  }
                                                : undefined
                                        }
                                    >
                                        {tagId}
                                    </span>
                                );
                            })}
                        </div>
                    )}

                    <div className="sch-detail-meta">
                        <span>
                            <Clock className="icon-xxs" /> {event.eventDate} at {event.eventTime}
                        </span>
                        <span>
                            <User className="icon-xxs" /> {event.author}
                        </span>
                    </div>

                    {event.description && <p className="sch-detail-desc">{event.description}</p>}

                    {!editable && <p className="sch-lock-note">{t.lockNote}</p>}
                </div>

                <div className="sch-overlay-footer sch-overlay-footer-split">
                    {editable ? (
                        <>
                            <button className="sch-btn-danger" onClick={onDelete}>
                                <Trash2 className="icon-xs" />
                                <span>{t.delete}</span>
                            </button>
                            <button className="sch-btn-primary" onClick={onEdit}>
                                <Pencil className="icon-xs" />
                                <span>{t.edit}</span>
                            </button>
                        </>
                    ) : (
                        <button className="sch-btn-secondary" onClick={onClose}>
                            {t.close}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
