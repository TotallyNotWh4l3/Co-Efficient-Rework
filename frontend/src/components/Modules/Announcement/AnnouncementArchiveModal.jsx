
// ===================================================
// ファイル名: AnnouncementArchiveModal.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: アーカイブされたお知らせモーダルコンポーネント
// ===================================================

import React, { useEffect, useState } from "react";
import { Archive, RotateCcw, X } from "lucide-react";
import announcementService from "../../../services/announcementService";
import {
    getPrimaryCategory,
    CATEGORY_CONFIG,
} from "../../../constants/modules/announcementConstants";
import "./announcement-module.css";

export default function AnnouncementArchiveModal({
    isJapanese,
    isManagerOrAbove,
    onClose,
    onRestored,
}) {
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        announcementService
            .getArchived()
            .then(setItems)
            .finally(() => setIsLoading(false));
    }, []);

    const handleRestore = async (id) => {
        const restored = await announcementService.restore(id);
        setItems((prev) => prev.filter((a) => a.id !== id));
        onRestored && onRestored(restored);
    };

    return (
        <div className="ann-overlay">
            <div className="ann-overlay-header">
                <span className="ann-overlay-title">
                    <Archive className="icon-sm" />
                    {isJapanese ? "アーカイブ済みのお知らせ" : "Archived Bulletins"}
                </span>
                <button className="ann-icon-btn" onClick={onClose}>
                    <X className="icon-xs" />
                </button>
            </div>

            <div className="ann-overlay-body">
                {isLoading && (
                    <p className="ann-empty-text">{isJapanese ? "読み込み中..." : "Loading..."}</p>
                )}

                {!isLoading && items.length === 0 && (
                    <p className="ann-empty-text">
                        {isJapanese
                            ? "アーカイブされたお知らせはありません。"
                            : "No archived bulletins."}
                    </p>
                )}

                {items.map((item) => {
                    const primCat = getPrimaryCategory(item.categories);
                    const cfg = CATEGORY_CONFIG[primCat];
                    const Icon = cfg.icon;
                    return (
                        <div key={item.id} className={`ann-item ${cfg.className}`}>
                            <div className="ann-item-main">
                                <div className={`ann-item-icon ${cfg.className}`}>
                                    <Icon className="icon-sm" />
                                </div>
                                <div className="ann-item-body">
                                    <h4 className="ann-item-title">
                                        {isJapanese ? item.titleJa || item.title : item.title}
                                    </h4>
                                    <p className="ann-item-desc">
                                        {isJapanese ? item.contentJa || item.content : item.content}
                                    </p>
                                    <p className="ann-item-meta">
                                        {isJapanese ? "アーカイブ日" : "Archived"}:{" "}
                                        {item.archivedAt?.split(" ")[0]}
                                    </p>
                                </div>
                            </div>

                            {isManagerOrAbove && (
                                <button
                                    className="ann-restore-btn"
                                    onClick={() => handleRestore(item.id)}
                                >
                                    <RotateCcw className="icon-xs" />
                                    {isJapanese ? "復元" : "Restore"}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
