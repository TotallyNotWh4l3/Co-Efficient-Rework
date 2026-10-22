// ===================================================
// ファイル名: SunArc.jsx
// 作成日: 2026/10/21
// 概要: 日の出〜日の入りの太陽軌道アーク（現在位置マーカー付き）
//       通過済みの軌道は発光ラインと下地グラデーションで描画し、太陽は脈動する。
//       body="moon" のときは月の出〜月の入りの軌道を月相付きの月で描く。
// ===================================================

import { useId } from "react";
import { localMs, hhmm } from "../utils/meteo";

const CX = 100;
const BASE_Y = 92;
const RX = 80;
const RY = 66;

const pointAt = (p) => [CX - RX * Math.cos(Math.PI * p), BASE_Y - RY * Math.sin(Math.PI * p)];

function arcPath(from, to) {
    const steps = Math.max(2, Math.round((to - from) * 50));
    let d = "";
    for (let i = 0; i <= steps; i++) {
        const [x, y] = pointAt(from + ((to - from) * i) / steps);
        d += `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    }
    return d;
}

const MOON_R = 6.5;

// Lit part of the moon disc for a phase in 0..1 (northern-hemisphere view:
// waxing = right side lit). Origin is the disc centre.
function moonLitPath(phase) {
    const c = Math.cos(2 * Math.PI * phase);
    const waxing = phase < 0.5;
    const crescent = c > 0;
    const rx = (MOON_R * Math.abs(c)).toFixed(2);
    const limb = waxing ? 1 : 0;
    const term = waxing === crescent ? 0 : 1;
    return `M0,${-MOON_R}A${MOON_R},${MOON_R} 0 0 ${limb} 0,${MOON_R}A${rx},${MOON_R} 0 0 ${term} 0,${-MOON_R}Z`;
}

export default function SunArc({ sunrise, sunset, now, body = "sun", phase, riseLabel, setLabel }) {
    const moon = body === "moon";
    const gradId = `wxp-sun-${useId().replace(/:/g, "")}`;
    const rise = localMs(sunrise);
    const set = localMs(sunset);
    const t = localMs(now);

    const valid = [rise, set, t].every(Number.isFinite) && set > rise;
    const raw = valid ? (t - rise) / (set - rise) : 0;
    const up = raw >= 0 && raw <= 1;
    const p = Math.min(1, Math.max(0, raw));
    const [sx, sy] = pointAt(p);
    const [x0] = pointAt(0);

    return (
        <svg
            className={`wxp-sunarc${moon ? " wxp-sunarc--moon" : ""}`}
            viewBox="0 0 200 118"
            role="img"
        >
            <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" style={{ stopColor: "var(--arc)", stopOpacity: 0.3 }} />
                    <stop offset="100%" style={{ stopColor: "var(--arc)", stopOpacity: 0 }} />
                </linearGradient>
            </defs>

            <line className="wxp-sunarc__horizon" x1="10" x2="190" y1={BASE_Y} y2={BASE_Y} />
            <path className="wxp-sunarc__track" d={arcPath(0, 1)} />
            {valid && p > 0 && (
                <>
                    <path
                        className="wxp-sunarc__fill"
                        d={`${arcPath(0, p)}L${sx.toFixed(1)},${BASE_Y}L${x0.toFixed(1)},${BASE_Y}Z`}
                        fill={`url(#${gradId})`}
                    />
                    <path className="wxp-sunarc__done" d={arcPath(0, p)} pathLength="1" />
                </>
            )}
            {valid && up && !moon && <circle className="wxp-sunarc__pulse" cx={sx} cy={sy} r="6" />}
            {valid && moon && (
                <g transform={`translate(${sx.toFixed(1)} ${sy.toFixed(1)})`}>
                    <circle
                        className={`wxp-sunarc__moon-dark${up ? "" : " wxp-sunarc__moon--down"}`}
                        r={MOON_R}
                    />
                    {up && Number.isFinite(phase) && (
                        <path className="wxp-sunarc__moon-lit" d={moonLitPath(phase)} />
                    )}
                </g>
            )}
            {valid && !moon && (
                <circle
                    className={`wxp-sunarc__sun${up ? "" : " wxp-sunarc__sun--down"}`}
                    cx={sx}
                    cy={sy}
                    r="6"
                />
            )}
            <text className="wxp-sunarc__time" x={CX - RX} y="108" textAnchor="middle">
                {riseLabel ?? hhmm(sunrise)}
            </text>
            <text className="wxp-sunarc__time" x={CX + RX} y="108" textAnchor="middle">
                {setLabel ?? hhmm(sunset)}
            </text>
        </svg>
    );
}
