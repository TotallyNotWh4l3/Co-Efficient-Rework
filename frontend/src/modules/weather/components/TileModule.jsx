// ===================================================
// ファイル名: TileModule.jsx
// 作成日: 2026/10/27
// 概要: 計器タイル（wxp-tile）モジュール。表示する指標と、下部が
//       グラフ(スパークライン)かゲージかをレイアウト設定で切り替えられる。
//       指標の値・サブ表示などは buildMetrics.jsx が作る。
//       2026/10/30: ・サブ表示（値の下の小さな文字）を別の指標に変えたり、消したりできる
//                   ・グラフ（ゲージ）の色を上書きできる（未指定なら指標の既定色）
//                   ・グラフの線の太さ・なめらかさ・塗りの濃さを受け取る
// ===================================================

import { Bell } from "lucide-react";

import { GRAPH_DEFAULTS } from "../utils/graphStyle";
import { fmt } from "../utils/meteo";
import CountUp from "./CountUp";
import Sparkline from "./Sparkline";

// "Humidity 62%" / "Wind 3.2 m/s" — a metric shown as the tile's secondary line.
// "%" hugs the number, other units get a space.
function subText(m) {
    const unit = m.unit ? `${m.unit === "%" ? "" : " "}${m.unit}` : "";
    return `${m.label} ${fmt(m.value, m.digits)}${unit}`;
}

/**
 * @param {object} metric — one entry of buildMetrics().metrics
 * @param {"graph"|"gauge"} display — what the bottom part of the tile shows
 * @param {"default"|"none"|string} [sub] — secondary line: the metric's own ("default"),
 *   hidden ("none"), or another metric (then `subMetric` is that metric)
 * @param {object|null} [subMetric] — the metric shown as the secondary line
 * @param {string|null} [color] — "#rrggbb" override for the graph / gauge colour
 * @param {{lineWidth:number, smoothness:number, fillOpacity:number}} [graph]
 * @param {(id:string)=>void} onOpen — opens the metric's detail chart
 */
export default function TileModule({
    metric,
    display,
    sub: subMode = "default",
    subMetric = null,
    color = null,
    graph = GRAPH_DEFAULTS,
    onOpen,
}) {
    if (!metric) return <div className="wxp-tile wxp-tile--empty" />;

    const {
        id,
        label,
        value,
        digits,
        unit,
        sub: defaultSub,
        tone,
        alert,
        hint,
        accent,
        spark,
        sparkNow,
        gauge,
    } = metric;

    const sub = subMode === "none" ? null : subMetric ? subText(subMetric) : defaultSub;

    const style = {};
    if (!tone && accent) style["--accent"] = accent;
    if (color) style["--graph-color"] = color;

    return (
        <div
            className={`wxp-tile${tone ? ` wxp-tile--${tone}` : ""}${alert ? " wxp-tile--alert" : ""}`}
            style={Object.keys(style).length > 0 ? style : undefined}
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
                <Sparkline
                    className="wxp-tile__spark"
                    values={spark}
                    nowIndex={sparkNow}
                    area
                    lineWidth={graph.lineWidth}
                    smoothness={graph.smoothness}
                    fillOpacity={graph.fillOpacity}
                />
            )}
            {display === "gauge" && gauge !== null && (
                <div className="wxp-gauge">
                    <i style={{ "--fill": gauge }} />
                </div>
            )}
        </div>
    );
}
