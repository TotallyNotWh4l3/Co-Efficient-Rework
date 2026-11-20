// ===================================================
// ファイル名: Sparkline.jsx
// 作成日: 2026/10/21
// 概要: 計器タイル／ヒーロー背景用の極小SVG折れ線（現在時刻マーカー付き）
//       色は currentColor を使うため、親の CSS (color) で指定する。
//       2026/10/30: 線の太さ・なめらかさ・塗りの濃さを props で変えられるようにした
//                   （天気ページのグラフ設定。既定値は従来と同じ見た目）。
// ===================================================

import { GRAPH_DEFAULTS } from "../utils/graphStyle";
import { areaPath, linePath } from "../utils/smoothPath";

const W = 100;
const H = 30;
const PAD = 3;
// A sparkline is small, so it draws its line thinner than a chart does
// (1.5px at the default 2px chart width).
const WIDTH_RATIO = 0.75;

/**
 * @param {(number|null)[]} values — evenly spaced samples (null = gap)
 * @param {number} [nowIndex] — index of "now" (-1 = none)
 * @param {boolean} [area] — fill under the line
 * @param {boolean} [dot] — draw the "now" dot (turn off when stretched)
 * @param {number} [lineWidth] — chart-equivalent line width in px
 * @param {number} [smoothness] — 0 (straight) .. 1 (rounded)
 * @param {number} [fillOpacity] — strength of the area fill, 1 = default
 */
export default function Sparkline({
    values = [],
    nowIndex = -1,
    area = false,
    dot = true,
    className = "",
    lineWidth = GRAPH_DEFAULTS.lineWidth,
    smoothness = GRAPH_DEFAULTS.smoothness,
    fillOpacity = GRAPH_DEFAULTS.fillOpacity,
}) {
    const finite = values.filter(Number.isFinite);
    if (finite.length < 2) return null;

    let min = Math.min(...finite);
    let max = Math.max(...finite);
    if (min === max) {
        min -= 1;
        max += 1;
    }

    const n = values.length;
    const xAt = (i) => (i / (n - 1)) * W;
    const yAt = (v) => H - PAD - ((v - min) / (max - min)) * (H - 2 * PAD);

    const line = linePath(values, xAt, yAt, smoothness);
    const fill = area ? areaPath(values, xAt, yAt, H, smoothness) : "";

    const nowOk = nowIndex >= 0 && nowIndex < n && Number.isFinite(values[nowIndex]);
    const nx = nowOk ? xAt(nowIndex) : 0;
    const ny = nowOk ? yAt(values[nowIndex]) : 0;

    return (
        <svg
            className={`wxp-spark ${className}`}
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            style={{ "--spark-fill": fillOpacity }}
            aria-hidden="true"
        >
            {area && <path className="wxp-spark__area" d={fill} />}
            {nowOk && (
                <line
                    className="wxp-spark__now"
                    x1={nx}
                    x2={nx}
                    y1="0"
                    y2={H}
                    vectorEffect="non-scaling-stroke"
                />
            )}
            <path
                className="wxp-spark__line"
                d={line}
                style={{ strokeWidth: `${lineWidth * WIDTH_RATIO}px` }}
                vectorEffect="non-scaling-stroke"
            />
            {nowOk && dot && (
                <line
                    className="wxp-spark__dot"
                    x1={nx}
                    x2={nx}
                    y1={ny}
                    y2={ny}
                    vectorEffect="non-scaling-stroke"
                />
            )}
        </svg>
    );
}
