
// ===================================================
// ファイル名: AnnouncementToast.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: お知らせトーストコンポーネント
// ===================================================

import { CheckCircle2 } from "lucide-react";

export default function AnnouncementToast({ message }) {
    if (!message) return null;

    return (
        <div className="ann-toast">
            <CheckCircle2 className="icon-xs" />
            <span>{message}</span>
        </div>
    );
}
