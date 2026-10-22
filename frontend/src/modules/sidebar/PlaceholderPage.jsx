// ===================================================
// ファイル名: PlaceholderPage.jsx
// 作成日: 2026/09/29
// 概要: 未実装セクション用のプレースホルダーページ
// ===================================================

import { Construction } from "lucide-react";
import { useLanguage } from "../settings/useLanguage";
import "./placeholder-page.css";

export default function PlaceholderPage({ titleKey }) {
    const T = useLanguage();
    const title = T.sidebar.sections[titleKey] ?? titleKey;

    return (
        <div className="placeholder-page">
            <Construction size={32} className="placeholder-page__icon" />
            <h2 className="placeholder-page__title">{title}</h2>
            <p className="placeholder-page__text">{T.sidebar.comingSoon}</p>
        </div>
    );
}
