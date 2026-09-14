
// ===================================================
// ファイル名: AnnouncementHeader.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: お知らせヘッダー コンポーネント
// ===================================================

import { Megaphone, Plus, Lock, Archive, Maximize2, Minimize2, X } from "lucide-react";
import { useLanguage } from "../../../../hooks/useLanguage";

export default function AnnouncementHeader({
    filteredCount,
    unreadCount,
    currentUser,
    onCreate,
    onOpenArchive,
    isExtended,
    onToggleExtended,
    onRemove,
}) {
    const lang = useLanguage();
    const t = lang.modules.announcement.header;

    return (
        <div className="ann-header">
            <div className="ann-header-left">
                <div className="ann-header-icon">
                    <Megaphone className="icon-sm" />
                </div>
                <div>
                    <h3 className="ann-header-title">{t.title}</h3>
                    <p className="ann-header-subtitle">
                        {t.activeNotices} {filteredCount}
                        {unreadCount > 0 && (
                            <span className="ann-unread-badge">
                                {unreadCount} {t.unread}
                            </span>
                        )}
                    </p>
                </div>
            </div>

            <div className="ann-header-actions">
                {currentUser ? (
                    <button className="ann-btn-primary" onClick={onCreate}>
                        <Plus className="icon-xs" />
                        <span>{t.create}</span>
                    </button>
                ) : (
                    <div className="ann-viewer-badge">
                        <Lock className="icon-xxs" />
                        <span>{t.viewerOnly}</span>
                    </div>
                )}

                <button className="ann-icon-toggle" onClick={onOpenArchive} title={t.viewArchive}>
                    <Archive className="icon-xs" />
                </button>

                <button
                    className={`ann-icon-toggle ${isExtended ? "active" : ""}`}
                    onClick={onToggleExtended}
                    title={isExtended ? t.compactView : t.extendView}
                >
                    {isExtended ? (
                        <Minimize2 className="icon-xs" />
                    ) : (
                        <Maximize2 className="icon-xs" />
                    )}
                </button>

                <button className="ann-icon-toggle" onClick={onRemove} title={t.removeModule}>
                    <X className="icon-xs" />
                </button>
            </div>
        </div>
    );
}
