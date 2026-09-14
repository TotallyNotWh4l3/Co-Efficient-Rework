
// ===================================================
// ファイル名: AnnouncementItem.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: お知らせアイテムコンポーネント
// ===================================================

import { Pin, User, Calendar, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { useLanguage } from "../../../../hooks/useLanguage";
import {
    CATEGORY_CONFIG,
    getPrimaryCategory,
    formatTimestamp,
} from "../../../../constants/modules/announcementConstants";

export default function AnnouncementItem({
    item,
    isJapanese,
    canModify,
    onSelect,
    onEdit,
    onDelete,
}) {
    const lang = useLanguage();
    const t = lang.modules.announcement;

    const itemCats = item.categories || ["general"];
    const primCat = getPrimaryCategory(itemCats);
    const cfg = CATEGORY_CONFIG[primCat];
    const Icon = cfg.icon;
    const title = isJapanese ? item.titleJa || item.title : item.title;
    const desc = isJapanese ? item.contentJa || item.content : item.content;
    const stamp = formatTimestamp(item.createdAt, t.time);
    const modifiable = canModify(item);

    return (
        <div
            className={`ann-item ${cfg.className} ${!item.isRead ? "ann-item-unread" : ""}`}
            onClick={onSelect}
        >
            {!item.isRead && <div className="ann-unread-dot" title={t.item.unread} />}
            {item.isPinned && (
                <div className="ann-pin-indicator">
                    <Pin className="icon-xxs" />
                </div>
            )}

            <div className="ann-item-main">
                <div className={`ann-item-icon ${cfg.className}`}>
                    <Icon className="icon-sm" />
                </div>
                <div className="ann-item-body">
                    <h4 className="ann-item-title">
                        {title}
                        {item.isEdited && <span className="ann-flag">[{t.item.edited}]</span>}
                    </h4>
                    <div className="ann-tag-row">
                        {itemCats.map((cat) => (
                            <span key={cat} className={`ann-tag ${CATEGORY_CONFIG[cat].className}`}>
                                {t.categories[cat]}
                            </span>
                        ))}
                    </div>
                    <p className="ann-item-desc">{desc}</p>
                </div>
            </div>

            <div className="ann-item-footer">
                <div className="ann-item-meta-group">
                    <span className="ann-item-meta">
                        <User className="icon-xxs" />
                        {item.author}
                    </span>
                    <span>•</span>
                    <span className="ann-item-meta">
                        <Calendar className="icon-xxs" />
                        {stamp}
                    </span>
                </div>

                <div className="ann-item-controls">
                    {modifiable && (
                        <>
                            <button
                                className="ann-item-action"
                                onClick={(e) => onEdit(item, e)}
                                title={t.item.edit}
                            >
                                <Pencil className="icon-xxs" />
                            </button>
                            <button
                                className="ann-item-action ann-item-action-danger"
                                onClick={(e) => onDelete(item.id, e)}
                                title={t.item.delete}
                            >
                                <Trash2 className="icon-xxs" />
                            </button>
                        </>
                    )}
                    <ChevronRight className="icon-xs ann-chevron" />
                </div>
            </div>
        </div>
    );
}
