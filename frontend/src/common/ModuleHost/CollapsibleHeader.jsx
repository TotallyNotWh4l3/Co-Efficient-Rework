// ===================================================
// ファイル名: CollapsibleHeader.jsx
// 概要: モジュールのヘッダーを折りたたみ可能にする共通ラッパー。
//       折りたたむとヘッダーが隠れ、細いバーだけが残る（本文の領域が広がる）。
// ===================================================

import { ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "../../modules/settings/useLanguage";

import "./collapsible-header.css";

export default function CollapsibleHeader({ collapsed, onToggle, children }) {
    const lang = useLanguage();
    const t = lang.common;
    const label = collapsed ? t.expandHeader : t.collapseHeader;

    return (
        <div className={`chdr${collapsed ? " chdr--collapsed" : ""}`}>
            {!collapsed && children}
            <button
                type="button"
                className="chdr__toggle"
                title={label}
                aria-label={label}
                aria-expanded={!collapsed}
                onClick={(e) => {
                    e.stopPropagation();
                    onToggle();
                }}
            >
                {collapsed ? <ChevronDown className="icon-xxs" /> : <ChevronUp className="icon-xxs" />}
            </button>
        </div>
    );
}
