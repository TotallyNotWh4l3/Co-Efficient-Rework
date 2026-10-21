// ===================================================
// ファイル名: TimeSeries.jsx
// 作成日: 2026/10/21
// 概要: 天気ページ用の軽量SVG時系列チャート
//       （折れ線・棒、左右2軸、現在時刻マーカー、ホバー読み取り）
// ===================================================

import { useRef, useState } from "react";

const W = 800;
const H = 220;
const PAD = { l: 46, r: 46, t: 12, b: 24 };
const INNER_W = W - PAD.l - PAD.r;
const INNER_H = H - PAD.t - PAD.b;

function niceScale(min, max, count = 4) {
    let lo = min;
    let hi = max;
    if (lo === hi) {
        lo -= 1;
        hi += 1;
    }
    const raw = (hi - lo) / count;
    const mag = 10 ** Math.floor(Math.log10(raw));
    const norm = raw / mag;
    const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
    const start = Math.floor(lo / step) * step;
    const end = Math.ceil(hi / step) * step;
    const ticks = [];
    for (let v = start; v <= end + step / 2; v += step) ticks.push(+v.toFixed(10));
    return { lo: start, hi: end, ticks };
}

function buildScale(seriesOnAxis, fixed) {
    if (fixed) {
        const { ticks } = niceScale(fixed[0], fixed[1]);
        return {
            lo: fixed[0],
            hi: fixed[1],
            ticks: ticks.filter((t) => t >= fixed[0] && t <= fixed[1]),
        };
    }
    const values = seriesOnAxis.flatMap((s) => s.values).filter((v) => Number.isFinite(v));
    if (values.length === 0) return null;
    let min = Math.min(...values);
    let max = Math.max(...values);
    if (seriesOnAxis.some((s) => s.kind === "bar")) min = Math.min(0, min);
    return niceScale(min, max);
}

function pathFor(values, xAt, yAt) {
    let d = "";
    let pen = false;
    values.forEach((v, i) => {
        if (!Number.isFinite(v)) {
            pen = false;
            return;
        }
        d += `${pen ? "L" : "M"}${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`;
        pen = true;
    });
    return d;
}

function pickStride(n) {
    const target = n / 9;
    return [1, 2, 3, 4, 6, 12, 24].find((s) => s >= target) ?? 24;
}

/**
 * @param {string[]} times — location-local ISO strings, one per point
 * @param {Array<{key, label, color, values:(number|null)[], axis?:"left"|"right",
 *   kind?:"line"|"bar", unit?:string, digits?:number, dashed?:boolean}>} series
 * @param {number} nowIndex — index of "now" within `times` (or -1)
 * @param {[number, number]} [leftDomain] / [rightDomain] — fixed axis ranges
 */
export default function TimeSeries({
    times,
    series,
    nowIndex = -1,
    nowLabel = "NOW",
    leftDomain,
    rightDomain,
}) {
    const svgRef = useRef(null);
    const [hover, setHover] = useState(null);

    const n = times.length;
    const step = INNER_W / Math.max(n, 1);
    const xAt = (i) => PAD.l + (i + 0.5) * step;

    const left = series.filter((s) => (s.axis ?? "left") === "left");
    const right = series.filter((s) => s.axis === "right");
    const leftScale = buildScale(left, leftDomain);
    const rightScale = right.length ? buildScale(right, rightDomain) : null;

    const yFor = (scale) => (v) =>
        PAD.t + INNER_H - ((v - scale.lo) / (scale.hi - scale.lo || 1)) * INNER_H;

    const scaleOf = (s) => ((s.axis ?? "left") === "left" ? leftScale : rightScale);

    function handleMove(e) {
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect || n === 0) return;
        const x = ((e.clientX - rect.left) / rect.width) * W;
        setHover(Math.min(n - 1, Math.max(0, Math.floor((x - PAD.l) / step))));
    }

    const readIdx = hover ?? (nowIndex >= 0 ? nowIndex : 0);
    const stride = pickStride(n);
    const refScale = leftScale ?? rightScale;

    return (
        <div className="wxp-chart">
            <svg
                ref={svgRef}
                className="wxp-chart__svg"
                viewBox={`0 0 ${W} ${H}`}
                onPointerMove={handleMove}
                onPointerLeave={() => setHover(null)}
                role="img"
            >
                {/* grid + left axis labels */}
                {refScale?.ticks.map((t) => {
                    const y = yFor(refScale)(t);
                    return (
                        <g key={`g${t}`}>
                            <line
                                className="wxp-chart__grid"
                                x1={PAD.l}
                                x2={W - PAD.r}
                                y1={y}
                                y2={y}
                            />
                            {leftScale && (
                                <text
                                    className="wxp-chart__tick"
                                    x={PAD.l - 6}
                                    y={y + 3}
                                    textAnchor="end"
                                >
                                    {t}
                                </text>
                            )}
                        </g>
                    );
                })}

                {/* right axis labels */}
                {rightScale?.ticks.map((t) => (
                    <text
                        key={`r${t}`}
                        className="wxp-chart__tick"
                        x={W - PAD.r + 6}
                        y={yFor(rightScale)(t) + 3}
                        textAnchor="start"
                    >
                        {t}
                    </text>
                ))}

                {/* x labels + midnight separators */}
                {times.map((t, i) => {
                    const hour = Number(t.slice(11, 13));
                    const midnight = hour === 0;
                    const showLabel = hour % stride === 0;
                    return (
                        <g key={t}>
                            {midnight && i > 0 && (
                                <line
                                    className="wxp-chart__day"
                                    x1={xAt(i) - step / 2}
                                    x2={xAt(i) - step / 2}
                                    y1={PAD.t}
                                    y2={PAD.t + INNER_H}
                                />
                            )}
                            {showLabel && (
                                <text
                                    className="wxp-chart__tick"
                                    x={xAt(i)}
                                    y={H - 7}
                                    textAnchor="middle"
                                >
                                    {midnight
                                        ? `${t.slice(5, 7)}/${t.slice(8, 10)}`
                                        : String(hour).padStart(2, "0")}
                                </text>
                            )}
                        </g>
                    );
                })}

                {/* bars first so lines sit on top */}
                {series
                    .filter((s) => s.kind === "bar")
                    .map((s) => {
                        const scale = scaleOf(s);
                        if (!scale) return null;
                        const y = yFor(scale);
                        const base = y(Math.max(0, scale.lo));
                        return s.values.map((v, i) =>
                            Number.isFinite(v) && v > 0 ? (
                                <rect
                                    key={`${s.key}${i}`}
                                    x={xAt(i) - step * 0.35}
                                    width={step * 0.7}
                                    y={y(v)}
                                    height={Math.max(0, base - y(v))}
                                    style={{ fill: s.color }}
                                    opacity="0.55"
                                />
                            ) : null,
                        );
                    })}

                {series
                    .filter((s) => s.kind !== "bar")
                    .map((s) => {
                        const scale = scaleOf(s);
                        if (!scale) return null;
                        return (
                            <path
                                key={s.key}
                                className="wxp-chart__line"
                                d={pathFor(s.values, xAt, yFor(scale))}
                                style={{ stroke: s.color }}
                                strokeDasharray={s.dashed ? "4 3" : undefined}
                            />
                        );
                    })}

                {nowIndex >= 0 && nowIndex < n && (
                    <g>
                        <line
                            className="wxp-chart__now"
                            x1={xAt(nowIndex)}
                            x2={xAt(nowIndex)}
                            y1={PAD.t}
                            y2={PAD.t + INNER_H}
                        />
                        <text className="wxp-chart__now-label" x={xAt(nowIndex) + 4} y={PAD.t + 9}>
                            {nowLabel}
                        </text>
                    </g>
                )}

                {hover !== null && (
                    <line
                        className="wxp-chart__cursor"
                        x1={xAt(hover)}
                        x2={xAt(hover)}
                        y1={PAD.t}
                        y2={PAD.t + INNER_H}
                    />
                )}
            </svg>

            <div className="wxp-chart__readout">
                <span className="wxp-chart__readout-time">
                    {times[readIdx]?.replace("T", " ") ?? "--"}
                </span>
                {series.map((s) => {
                    const v = s.values[readIdx];
                    return (
                        <span key={s.key} className="wxp-chart__readout-item">
                            <i className="wxp-chart__swatch" style={{ background: s.color }} />
                            {s.label} <b>{Number.isFinite(v) ? v.toFixed(s.digits ?? 0) : "--"}</b>
                            {s.unit ? <em>{s.unit}</em> : null}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}
