// ===================================================
// ファイル名: WeatherChart.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 天気チャート コンポーネント
// ===================================================


import React, { useState, useRef } from "react";
import "../weather.css";

import { useLanguage } from "../../../../hooks/useLanguage";
const CURVE_SMOOTHNESS = 0;
const AXIS_PADDING = 1;
// ─────────────────────────────────────────────────────────────────────────

/**
 * Props:
 * - dataset: [{ label, value, valueMax?, valueMin? }]
 * - metricInfo: { id, labelEn, labelJa, color, unit }
 * - isJapanese: boolean
 * - isHourly: boolean — dual max/min lines are only shown for the 7-day temp view
 * - allDaysDataset: optional array of datasets (same shape as `dataset`), one
 *   per day. When passed on the hourly view, the axis min/max is computed
 *   across ALL of these days instead of just the day currently shown, so the
 *   scale — and therefore the curve shapes — are directly comparable across
 *   days. If omitted, falls back to using just `dataset`.
 */
export default function WeatherChart({
    dataset,
    metricInfo,
    isJapanese,
    isHourly,
    allDaysDataset,
}) {
    const [hoveredIdx, setHoveredIdx] = useState(null);
    const svgRef = useRef(null);
    const lang = useLanguage();
    const t = lang.modules.weather.chart;

    if (!dataset || dataset.length === 0) return null;

    const width = 500;
    const height = 110;
    const paddingX = 0;
    const paddingY = 15;
    // Reserved space on the left for the max/mid/min value labels, so the
    // curve/line itself starts to the right of the text instead of under it.
    const paddingLeft = 26;

    const isDual = metricInfo.id === "temp" && !isHourly;

    // For the hourly view, pull values from every day (when provided) so the
    // axis range reflects the whole week, not just whichever day is showing.
    // This is what makes the curve shapes directly comparable when clicking
    // between days — the scale doesn't jump around per-day.
    const rangeSourceDatasets =
        isHourly && allDaysDataset && allDaysDataset.length > 0 ? allDaysDataset : [dataset];

    let rawMin, rawMax;
    if (isDual) {
        const allVals = rangeSourceDatasets.flatMap((ds) =>
            ds.flatMap((d) => [d.valueMax ?? d.value, d.valueMin ?? d.value]),
        );
        rawMin = Math.min(...allVals);
        rawMax = Math.max(...allVals);
    } else {
        const allVals = rangeSourceDatasets.flatMap((ds) => ds.map((d) => d.value));
        rawMin = Math.min(...allVals);
        rawMax = Math.max(...allVals);
    }

    // Round to whole numbers with a bit of padding, rather than snapping to
    // multiples of 5/10 — so the axis shows plain values like 21, 22, 34, 36.
    const minVal = Math.floor(rawMin - AXIS_PADDING);
    const maxVal = Math.ceil(rawMax + AXIS_PADDING);
    // Only temperature can legitimately go below 0 — clamp everything else
    // (%, wind speed, etc.) so it never shows a negative axis label.
    const clampedMinVal = metricInfo.id === "temp" ? minVal : Math.max(0, minVal);
    const valRange = maxVal - clampedMinVal === 0 ? 1 : maxVal - clampedMinVal;
    const midVal = Math.round((clampedMinVal + maxVal) / 2);

    const toPoints = (pickValue) =>
        dataset.map((d, idx) => {
            const x =
                paddingX +
                paddingLeft +
                (idx / (dataset.length - 1)) * (width - 2 * paddingX - paddingLeft);
            const y =
                height -
                paddingY -
                ((pickValue(d) - clampedMinVal) / valRange) * (height - 2 * paddingY);
            const hour = d.label.slice(0, 2);
            return {
                x,
                y,
                value: pickValue(d),
                label: hour,
            };
        });

    const pointsMax = isDual ? toPoints((d) => d.valueMax ?? d.value) : [];
    const pointsMin = isDual ? toPoints((d) => d.valueMin ?? d.value) : [];
    const pointsSingle = !isDual ? toPoints((d) => d.value) : [];

    // Shared x-grid used for hit-testing mouse position — identical whether
    // we're in dual (max/min) or single-line mode, since both are built from
    // the same idx/dataset.length formula in toPoints.
    const xGridPoints = isDual ? pointsMax : pointsSingle;

    const getBezierPath = (pts) => {
        if (pts.length === 0) return "";
        let pathD = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 1; i < pts.length; i++) {
            const prev = pts[i - 1];
            const curr = pts[i];
            const cpX1 = prev.x + (curr.x - prev.x) * CURVE_SMOOTHNESS;
            const cpY1 = prev.y;
            const cpX2 = prev.x + (curr.x - prev.x) * (1 - CURVE_SMOOTHNESS);
            const cpY2 = curr.y;
            pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
        }
        return pathD;
    };

    const getAreaPath = (pts, pathD) => {
        if (pts.length === 0) return "";
        return `${pathD} L ${pts[pts.length - 1].x} ${height - paddingY} L ${pts[0].x} ${height - paddingY} Z`;
    };

    const pathMaxD = getBezierPath(pointsMax);
    const areaMaxD = getAreaPath(pointsMax, pathMaxD);
    const pathMinD = getBezierPath(pointsMin);
    const areaMinD = getAreaPath(pointsMin, pathMinD);
    const pathSingleD = getBezierPath(pointsSingle);
    const areaSingleD = getAreaPath(pointsSingle, pathSingleD);

    // Dots are only ever shown on the daily (7-day) view. On the hourly view
    // there are too many points for individual dots to read well, so only
    // the hover indicator (vertical line + tooltip) is used instead.
    const showDots = !isHourly;

    const renderPoints = isDual
        ? [
              ...pointsMax.map((p, i) => ({ ...p, color: "#f87171", isMax: true, origIdx: i })),
              ...pointsMin.map((p, i) => ({ ...p, color: "#60a5fa", isMin: true, origIdx: i })),
          ]
        : pointsSingle.map((p, i) => ({
              ...p,
              color: metricInfo.color,
              isSingle: true,
              origIdx: i,
          }));

    // Finds the nearest x-index to the mouse position anywhere over the
    // chart, not just when hovering the dot/line itself.
    const handlePointerMove = (e) => {
        const svg = svgRef.current;
        if (!svg || xGridPoints.length === 0) return;
        const rect = svg.getBoundingClientRect();
        if (rect.width === 0) return;
        const scale = width / rect.width;
        const relX = (e.clientX - rect.left) * scale;

        let nearestIdx = 0;
        let nearestDist = Infinity;
        xGridPoints.forEach((p, i) => {
            const dist = Math.abs(p.x - relX);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearestIdx = i;
            }
        });
        setHoveredIdx(nearestIdx);
    };

    const handlePointerLeave = () => setHoveredIdx(null);

    return (
        <div className="weather-chart">
            <div className="weather-chart__header">
                <span className="weather-chart__title">
                    <span
                        className="weather-chart__dot"
                        style={{
                            backgroundColor: metricInfo.color,
                            boxShadow: `0 0 8px ${metricInfo.color}`,
                        }}
                    ></span>
                    {isJapanese ? metricInfo.labelJa : metricInfo.labelEn} ({metricInfo.unit})
                </span>
                <span className="weather-chart__range">
                    {t.range}: {clampedMinVal}-{maxVal} {metricInfo.unit}
                </span>
            </div>

            <div className="weather-chart__svg-wrap">
                <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="weather-chart__svg">
                    <defs>
                        <linearGradient id="grad-temp-max" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f87171" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#f87171" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="grad-temp-min" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id={`grad-${metricInfo.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={metricInfo.color} stopOpacity="0.4" />
                            <stop offset="100%" stopColor={metricInfo.color} stopOpacity="0.0" />
                        </linearGradient>
                    </defs>

                    <line
                        x1={paddingX + paddingLeft}
                        y1={paddingY}
                        x2={width - paddingX}
                        y2={paddingY}
                        stroke="rgba(255,255,255,0.05)"
                        strokeDasharray="2 2"
                    />
                    <line
                        x1={paddingX + paddingLeft}
                        y1={height - paddingY}
                        x2={width - paddingX}
                        y2={height - paddingY}
                        stroke="rgba(255,255,255,0.12)"
                    />

                    {/* Value-axis labels: max / mid / min — sit in the reserved
                        paddingLeft strip, clear of the curve/lines */}
                    <text
                        x={paddingX}
                        y={paddingY + 3}
                        fill="rgba(255,255,255,0.35)"
                        fontFamily="JetBrains Mono, monospace"
                        fontSize="8px"
                        textAnchor="start"
                    >
                        {maxVal}
                    </text>
                    <text
                        x={paddingX}
                        y={height / 2 + 3}
                        fill="rgba(255,255,255,0.35)"
                        fontFamily="JetBrains Mono, monospace"
                        fontSize="8px"
                        textAnchor="start"
                    >
                        {midVal}
                    </text>
                    <text
                        x={paddingX}
                        y={height - paddingY - 2}
                        fill="rgba(255,255,255,0.35)"
                        fontFamily="JetBrains Mono, monospace"
                        fontSize="8px"
                        textAnchor="start"
                    >
                        {clampedMinVal}
                    </text>

                    {isDual ? (
                        <>
                            {areaMinD && <path d={areaMinD} fill="url(#grad-temp-min)" />}
                            {areaMaxD && <path d={areaMaxD} fill="url(#grad-temp-max)" />}
                        </>
                    ) : (
                        areaSingleD && <path d={areaSingleD} fill={`url(#grad-${metricInfo.id})`} />
                    )}

                    {isDual ? (
                        <>
                            {pathMinD && (
                                <path
                                    d={pathMinD}
                                    fill="none"
                                    stroke="#60a5fa"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{
                                        filter: "drop-shadow(0 1px 4px rgba(96, 165, 250, 0.2))",
                                    }}
                                />
                            )}
                            {pathMaxD && (
                                <path
                                    d={pathMaxD}
                                    fill="none"
                                    stroke="#f87171"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{
                                        filter: "drop-shadow(0 1px 4px rgba(248, 113, 113, 0.2))",
                                    }}
                                />
                            )}
                        </>
                    ) : (
                        pathSingleD && (
                            <path
                                d={pathSingleD}
                                fill="none"
                                stroke={metricInfo.color}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ filter: `drop-shadow(0 1px 4px ${metricInfo.color}30)` }}
                            />
                        )
                    )}

                    {renderPoints.map((pt, idx) => {
                        const isHovered = hoveredIdx === pt.origIdx;
                        return (
                            <g key={idx}>
                                {isHovered && (
                                    <line
                                        x1={pt.x}
                                        y1={paddingY}
                                        x2={pt.x}
                                        y2={height - paddingY}
                                        stroke="rgba(255,255,255,0.15)"
                                        strokeDasharray="2 2"
                                    />
                                )}
                                {showDots && (
                                    <>
                                        {isHovered && (
                                            <circle
                                                cx={pt.x}
                                                cy={pt.y}
                                                r="6"
                                                fill={pt.color}
                                                opacity="0.3"
                                            />
                                        )}
                                        <circle
                                            cx={pt.x}
                                            cy={pt.y}
                                            r={isHovered ? "4" : "2.5"}
                                            fill={isHovered ? "#fff" : pt.color}
                                            stroke={isHovered ? pt.color : "rgba(0,0,0,0.4)"}
                                            strokeWidth="1.2"
                                            style={{ transition: "all 0.1s ease" }}
                                        />
                                    </>
                                )}
                                {(pt.isMax || pt.isSingle) && (
                                    <text
                                        x={pt.x}
                                        y={height - 3}
                                        fill="rgba(255,255,255,0.4)"
                                        fontFamily="JetBrains Mono, monospace"
                                        fontSize="8px"
                                        textAnchor="middle"
                                    >
                                        {pt.label}
                                    </text>
                                )}
                            </g>
                        );
                    })}

                    {/* Invisible overlay — captures the mouse position across the
                        WHOLE plot area so the tooltip tracks whichever x-column the
                        cursor is over, rather than requiring a hover directly on a
                        dot or the line itself. Kept last so it sits on top and isn't
                        blocked by any of the drawn shapes above it. */}
                    <rect
                        x={paddingX + paddingLeft}
                        y={0}
                        width={width - paddingX - paddingLeft}
                        height={height}
                        fill="transparent"
                        style={{ cursor: "crosshair" }}
                        onMouseMove={handlePointerMove}
                        onMouseLeave={handlePointerLeave}
                    />
                </svg>

                {hoveredIdx !== null && dataset[hoveredIdx] && (
                    <div
                        className="weather-chart__tooltip"
                        style={{
                            left: `${Math.min(85, Math.max(3, ((pointsMax.length > 0 ? pointsMax[hoveredIdx].x : pointsSingle[hoveredIdx].x) / width) * 100 - 8))}%`,
                            top: `${Math.min(65, Math.max(2, ((isDual ? (pointsMax[hoveredIdx].y + pointsMin[hoveredIdx].y) / 2 : pointsSingle[hoveredIdx].y) / height) * 100 - 32))}%`,
                        }}
                    >
                        <div className="weather-chart__tooltip-label">
                            {dataset[hoveredIdx].label}
                        </div>
                        {isDual ? (
                            <div className="weather-chart__tooltip-dual">
                                <div className="weather-chart__tooltip-row">
                                    <span className="weather-chart__tooltip-swatch weather-chart__tooltip-swatch--max"></span>
                                    <span className="weather-chart__tooltip-name">{t.max}:</span>
                                    <span className="weather-chart__tooltip-num">
                                        {dataset[hoveredIdx].valueMax}°C
                                    </span>
                                </div>
                                <div className="weather-chart__tooltip-row">
                                    <span className="weather-chart__tooltip-swatch weather-chart__tooltip-swatch--min"></span>
                                    <span className="weather-chart__tooltip-name">{t.min}:</span>
                                    <span className="weather-chart__tooltip-num">
                                        {dataset[hoveredIdx].valueMin}°C
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="weather-chart__tooltip-single">
                                <span className="weather-chart__tooltip-num">
                                    {dataset[hoveredIdx].value}
                                    {metricInfo.unit}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
