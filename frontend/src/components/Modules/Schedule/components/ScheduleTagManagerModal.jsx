// ===================================================
// ファイル名: ScheduleTagManagerModal.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: スケジュールタグマネージャーモーダル コンポーネント
// ===================================================

import { useState } from "react";
import { X, Trash2 } from "lucide-react";
import { useLanguage } from "../../../../hooks/useLanguage";

export default function ScheduleTagManagerModal({ tags, onClose, onUpsert, onRemove }) {
    const lang = useLanguage();
    const t = lang.modules.schedule.tagManager;

    const [name, setName] = useState("");
    const [color, setColor] = useState("#3b82f6");
    const [submitting, setSubmitting] = useState(false);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setSubmitting(true);
        try {
            await onUpsert(name.trim(), color);
            setName("");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="sch-overlay" onClick={onClose}>
            <div className="sch-overlay-panel" onClick={(e) => e.stopPropagation()}>
                <div className="sch-overlay-header">
                    <span className="sch-overlay-title">{t.title}</span>
                    <button className="sch-icon-btn" onClick={onClose}>
                        <X className="icon-xs" />
                    </button>
                </div>

                <form className="sch-tag-add-form" onSubmit={handleAdd}>
                    <input
                        type="text"
                        className="sch-input"
                        placeholder={t.namePlaceholder}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <input
                        type="color"
                        className="sch-color-input"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                    />
                    <button type="submit" className="sch-btn-primary" disabled={submitting}>
                        {t.add}
                    </button>
                </form>

                <div className="sch-tag-list">
                    {tags.length === 0 ? (
                        <p className="sch-empty-text">{t.noTags}</p>
                    ) : (
                        tags.map((tag) => (
                            <div key={tag.id} className="sch-tag-list-row">
                                <span className="sch-tag-dot" style={{ background: tag.color }} />
                                <span className="sch-tag-list-name">{tag.id}</span>
                                <button
                                    className="sch-icon-toggle"
                                    onClick={() => onRemove(tag.id)}
                                    title={t.deleteTitle}
                                >
                                    <Trash2 className="icon-xxs" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
