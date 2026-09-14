// ===================================================
// ファイル名: AnnouncementList.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: お知らせリストコンポーネント
// ===================================================

import { Bell } from "lucide-react";
import { useLanguage } from "../../../../hooks/useLanguage";
import AnnouncementItem from "./AnnouncementItem";

export default function AnnouncementList({
    isJapanese,
    isExtended,
    isLoading,
    error,
    filtered,
    canModify,
    onSelectItem,
    onEditItem,
    onDeleteItem,
}) {
    const lang = useLanguage();
    const t = lang.modules.announcement.list;

    return (
        <div className="ann-list" style={{ maxHeight: isExtended ? "480px" : "none" }}>
            {isLoading && <p className="ann-empty-text">{t.loading}</p>}
            {error && <p className="ann-empty-text ann-error-text">{error}</p>}

            {!isLoading &&
                filtered.length > 0 &&
                filtered.map((item) => (
                    <AnnouncementItem
                        key={item.id}
                        item={item}
                        isJapanese={isJapanese}
                        canModify={canModify}
                        onSelect={() => onSelectItem(item)}
                        onEdit={(it, e) => onEditItem(it, e)}
                        onDelete={(id, e) => onDeleteItem(id, e)}
                    />
                ))}

            {!isLoading && filtered.length === 0 && (
                <div className="ann-empty-state">
                    <div className="ann-empty-icon">
                        <Bell className="icon-sm" />
                    </div>
                    <h5 className="ann-empty-title">{t.emptyTitle}</h5>
                    <p className="ann-empty-text">{t.emptyText}</p>
                </div>
            )}
        </div>
    );
}
