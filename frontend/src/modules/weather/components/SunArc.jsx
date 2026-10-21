// ===================================================
// ファイル名: SunArc.jsx
// 作成日: 2026/10/21
// 概要: 日の出〜日の入りの太陽軌道アーク（現在位置マーカー付き）
// ===================================================

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

export default function SunArc({ sunrise, sunset, now }) {
    const rise = localMs(sunrise);
    const set = localMs(sunset);
    const t = localMs(now);

    const valid = [rise, set, t].every(Number.isFinite) && set > rise;
    const raw = valid ? (t - rise) / (set - rise) : 0;
    const up = raw >= 0 && raw <= 1;
    const p = Math.min(1, Math.max(0, raw));
    const [sx, sy] = pointAt(p);

    return (
        <svg className="wxp-sunarc" viewBox="0 0 200 118" role="img">
            <line className="wxp-sunarc__horizon" x1="10" x2="190" y1={BASE_Y} y2={BASE_Y} />
            <path className="wxp-sunarc__track" d={arcPath(0, 1)} />
            {valid && p > 0 && <path className="wxp-sunarc__done" d={arcPath(0, p)} />}
            {valid && (
                <circle
                    className={`wxp-sunarc__sun${up ? "" : " wxp-sunarc__sun--down"}`}
                    cx={sx}
                    cy={sy}
                    r="6"
                />
            )}
            <text className="wxp-sunarc__time" x={CX - RX} y="108" textAnchor="middle">
                {hhmm(sunrise)}
            </text>
            <text className="wxp-sunarc__time" x={CX + RX} y="108" textAnchor="middle">
                {hhmm(sunset)}
            </text>
        </svg>
    );
}
