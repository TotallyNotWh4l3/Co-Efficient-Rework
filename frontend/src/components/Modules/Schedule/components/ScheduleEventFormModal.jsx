// ===================================================
// ファイル名: ScheduleEventFormModal.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: スケジュールイベントフォームモーダル コンポーネント
// ===================================================

import { useState } from "react";
import { X, Trash2, Clock } from "lucide-react";
import { useLanguage } from "../../../../hooks/useLanguage";
import ScheduleTagPicker from "./ScheduleTagPicker";

export default function ScheduleEventFormModal({
    mode,
    initialValues,
    authorName,
    tags,
    onClose,
    onSubmit,
    onDelete,
}) {
    const lang = useLanguage();
    const t = lang.modules.schedule.form;

    const [form, setForm] = useState(initialValues);
    const [submitting, setSubmitting] = useState(false);

    const toggleTag = (tagId) => {
        setForm((f) => {
            const has = f.tags.includes(tagId);
            return { ...f, tags: has ? f.tags.filter((t) => t !== tagId) : [...f.tags, tagId] };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.eventDate || !form.eventTime) return;
        setSubmitting(true);
        try {
            await onSubmit(form);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(t.confirmDelete)) return;
        setSubmitting(true);
        try {
            await onDelete();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="sch-overlay" onClick={onClose}>
            <div className="sch-overlay-panel" onClick={(e) => e.stopPropagation()}>
                <div className="sch-overlay-header">
                    <span className="sch-overlay-title">
                        {mode === "edit" ? t.titleEdit : t.titleAdd}
                    </span>
                    <button className="sch-icon-btn" onClick={onClose}>
                        <X className="icon-xs" />
                    </button>
                </div>

                <form className="sch-form" onSubmit={handleSubmit}>
                    <div>
                        <label className="sch-label">{t.titleField}</label>
                        <input
                            className="sch-input"
                            type="text"
                            required
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            placeholder={t.titlePlaceholder}
                        />
                    </div>

                    <div>
                        <label className="sch-label">{t.subtitleField}</label>
                        <input
                            className="sch-input"
                            type="text"
                            value={form.subtitle}
                            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                            placeholder={t.subtitlePlaceholder}
                        />
                    </div>

                    <div className="sch-form-row">
                        <div>
                            <label className="sch-label">{t.dateField}</label>
                            <input
                                className="sch-input"
                                type="date"
                                required
                                value={form.eventDate}
                                onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="sch-label">{t.timeField}</label>
                            <input
                                className="sch-input"
                                type="time"
                                required
                                value={form.eventTime}
                                onChange={(e) => setForm({ ...form, eventTime: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="sch-label">{t.tagsField}</label>
                        <ScheduleTagPicker
                            tags={tags}
                            selectedTags={form.tags}
                            onToggle={toggleTag}
                        />
                        {form.tags.length > 0 && (
                            <p className="sch-tag-priority-hint">{t.tagPriorityHint}</p>
                        )}
                    </div>

                    <div>
                        <label className="sch-label">{t.descriptionField}</label>
                        <textarea
                            className="sch-textarea"
                            rows={3}
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder={t.descriptionPlaceholder}
                        />
                    </div>

                    {mode === "edit" && authorName && (
                        <p className="sch-meta-line">
                            <Clock className="icon-xxs" /> {t.addedBy} {authorName}
                        </p>
                    )}

                    <div className="sch-form-actions">
                        {mode === "edit" && onDelete ? (
                            <button
                                type="button"
                                className="sch-btn-danger"
                                onClick={handleDelete}
                                disabled={submitting}
                            >
                                <Trash2 className="icon-xs" />
                                <span>{t.delete}</span>
                            </button>
                        ) : (
                            <div />
                        )}
                        <div className="sch-form-actions-right">
                            <button type="button" className="sch-btn-secondary" onClick={onClose}>
                                {t.cancel}
                            </button>
                            <button type="submit" className="sch-btn-primary" disabled={submitting}>
                                {mode === "edit" ? t.saveChanges : t.addEvent}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
