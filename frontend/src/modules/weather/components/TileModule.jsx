// ===================================================
// ファイル名: TileModule.jsx
// 作成日: 2026/10/27
// 概要: 計器タイル（wxp-tile）モジュール。表示する指標と、下部が
//       グラフ(スパークライン)かゲージかをレイアウト設定で切り替えられる。
//       指標の値・サブ表示などは buildMetrics.jsx が作る。
// ===================================================

import { Bell } from "lucide-react";

import CountUp from "./CountUp";
import Sparkline from "./Sparkline";

/**
 * @param {object} metric — one entry of buildMetrics().metrics
 * @param {"graph"|"gauge"} display — what the bottom part of the tile shows
 * @param {(id:string)=>void} onOpen — opens the metric's detail chart
 */
export default function TileModule({ metric, display, onOpen }) {
    if (!metric) return <div className="wxp-tile wxp-tile--empty" />;

    const {
        id,
        label,
        value,
        digits,
        unit,
        sub,
        tone,
        alert,
        hint,
        accent,
        spark,
        sparkNow,
        gauge,
    } = metric;

    return (
        <div
            className={`wxp-tile${tone ? ` wxp-tile--${tone}` : ""}${alert ? " wxp-tile--alert" : ""}`}
            style={tone || !accent ? undefined : { "--accent": accent }}
            title={hint}
            role="button"
            tabIndex={0}
            onClick={() => onOpen?.(id)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen?.(id)}
        >
            {alert && <Bell className="wxp-tile__bell" size={12} />}
            <div className="wxp-tile__label">{label}</div>
            <div className="wxp-tile__value">
                <CountUp value={value} digits={digits} />
                {unit && <span className="wxp-tile__unit">{unit}</span>}
            </div>
            {sub && <div className="wxp-tile__sub">{sub}</div>}
            {display === "graph" && (
                <Sparkline className="wxp-tile__spark" values={spark} nowIndex={sparkNow} area />
            )}
            {display === "gauge" && gauge !== null && (
                <div className="wxp-gauge">
                    <i style={{ "--fill": gauge }} />
                </div>
            )}
        </div>
    );
}
