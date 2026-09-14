
// ===================================================
// ファイル名: AnnouncementDetailOverlay.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: お知らせ詳細オーバーレイ コンポーネント
// ===================================================

import { X, Pin, User, Calendar } from "lucide-react";
import { useLanguage } from "../../../../hooks/useLanguage";
import {
    CATEGORY_CONFIG,
    formatTimestamp,
} from "../../../../constants/modules/announcementConstants";

export default function AnnouncementDetailOverlay({ item, isJapanese, onClose }) {
    const lang = useLanguage();
    const t = lang.modules.announcement;

    if (!item) return null;

    return (
        <div className="ann-overlay">
            <div className="ann-overlay-header">
                <div className="ann-tag-row">
                    {(item.categories || ["general"]).map((cat) => {
                        const cfg = CATEGORY_CONFIG[cat];
                        const Icon = cfg.icon;
                        return (
                            <span key={cat} className={`ann-badge ${cfg.className}`}>
                                <Icon className="icon-xxs" />
                                {t.categories[cat]}
                            </span>
                        );
                    })}
                </div>
                <button className="ann-icon-btn" onClick={onClose}>
                    <X className="icon-xs" />
                </button>
            </div>

            <div className="ann-overlay-body">
                {item.isPinned && (
                    <div className="ann-pinned-flag">
                        <Pin className="icon-xs" />
                        <span>{t.detail.pinned}</span>
                    </div>
                )}
                <h4 className="ann-detail-title">
                    {isJapanese ? item.titleJa || item.title : item.title}
                    {item.isEdited && <span className="ann-flag">[{t.detail.edited}]</span>}
                </h4>

                <div className="ann-detail-meta">
                    <span>
                        <User className="icon-xxs" />
                        {item.author}
                    </span>
                    <span>•</span>
                    <span>
                        <Calendar className="icon-xxs" />
                        {formatTimestamp(item.createdAt, t.time)}
                    </span>
                </div>

                <p className="ann-detail-content">
                    {isJapanese ? item.contentJa || item.content : item.content}
                </p>
            </div>

            <div className="ann-overlay-footer">
                <button className="ann-btn-secondary" onClick={onClose}>
                    {t.detail.closeReader}
                </button>
            </div>
        </div>
    );
}
