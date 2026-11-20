// ===================================================
// ファイル名: TendencyIcon.jsx
// 作成日: 2026/10/27
// 概要: 気圧傾向の矢印アイコン（旧 WeatherPage.jsx 内の関数を分離）
// ===================================================

import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";

export default function TendencyIcon({ tendency }) {
    if (!tendency) return null;
    const size = 12;
    if (tendency.key === "rising" || tendency.key === "risingFast") return <ArrowUp size={size} />;
    if (tendency.key === "falling" || tendency.key === "fallingFast")
        return <ArrowDown size={size} />;
    return <ArrowRight size={size} />;
}
