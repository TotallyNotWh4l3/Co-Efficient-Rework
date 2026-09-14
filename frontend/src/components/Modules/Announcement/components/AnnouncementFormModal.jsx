
// ===================================================
// ファイル名: AnnouncementFormModal.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: お知らせフォームモーダルコンポーネント
// ===================================================

import { Megaphone, X, Pin } from "lucide-react";
import { useLanguage } from "../../../../hooks/useLanguage";
import { CATEGORY_CONFIG } from "../../../../constants/modules/announcementConstants";

export default function AnnouncementFormModal({
    editingId,
    formTitle,
    formContent,
    formCategories,
    formIsPinned,
    onTitleChange,
    onContentChange,
    onToggleCategory,
    onPinnedChange,
    onSubmit,
    onClose,
}) {
    const lang = useLanguage();
    const t = lang.modules.announcement;
    const f = t.form;

    return (
        <div className="ann-overlay ann-overlay-form">
            <div className="ann-overlay-header">
                <span className="ann-overlay-title">
                    <Megaphone className="icon-sm" />
                    {editingId ? f.titleEdit : f.titleCreate}
                </span>
                <button className="ann-icon-btn" onClick={onClose}>
                    <X className="icon-xs" />
                </button>
            </div>

            <form onSubmit={onSubmit} className="ann-form">
                <div>
                    <label className="ann-label">{f.titleField}</label>
                    <input
                        type="text"
                        required
                        placeholder={f.titlePlaceholder}
                        value={formTitle}
                        onChange={(e) => onTitleChange(e.target.value)}
                        className="ann-input"
                    />
                </div>

                <div>
                    <label className="ann-label">{f.categoriesField}</label>
                    <div className="ann-tag-picker">
                        {Object.entries(CATEGORY_CONFIG).map(([id, cfg]) => {
                            const isSel = formCategories.includes(id);
                            return (
                                <button
                                    type="button"
                                    key={id}
                                    onClick={() => onToggleCategory(id)}
                                    className={`ann-tag-pick ${cfg.className} ${isSel ? "selected" : ""}`}
                                >
                                    {t.categories[id]}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="ann-pin-row">
                    <span className="ann-pin-hint">
                        {formCategories.includes("urgent") ? f.pinAutoHint : f.pinManualHint}
                    </span>
                    <label className="ann-checkbox-label">
                        <input
                            type="checkbox"
                            disabled={formCategories.includes("urgent")}
                            checked={formCategories.includes("urgent") || formIsPinned}
                            onChange={(e) => onPinnedChange(e.target.checked)}
                        />
                        <Pin className="icon-xs ann-pin-icon" />
                        {f.pinBulletin}
                    </label>
                </div>

                <div className="ann-form-grow">
                    <label className="ann-label">{f.contentField}</label>
                    <textarea
                        required
                        rows={4}
                        placeholder={f.contentPlaceholder}
                        value={formContent}
                        onChange={(e) => onContentChange(e.target.value)}
                        className="ann-textarea"
                    />
                </div>

                <div className="ann-form-actions">
                    <button type="button" className="ann-btn-secondary" onClick={onClose}>
                        {f.cancel}
                    </button>
                    <button type="submit" className="ann-btn-primary">
                        {editingId ? f.update : f.publish}
                    </button>
                </div>
            </form>
        </div>
    );
}
