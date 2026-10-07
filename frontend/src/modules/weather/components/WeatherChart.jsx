// ===================================================
// ファイル名: WeatherChart.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 天気チャート コンポーネント
// ===================================================

import React, { useState, useRef, useEffect } from "react";
import "../weather.css";

import { useLanguage } from "../../settings/useLanguage";
const CURVE_SMOOTHNESS = 0;
const AXIS_PADDING = 1;
// ─────────────────────────────────────────────────────────────────────────

/**
 * Props:
 * - dataset: [{ label, value, valueMax?, valueMin? }]
 * - metricInfo: { id, labelKey, color, unit }
 * - isHourly: boolean — dual max/min lines are only shown for the 7-day temp view
 * - allDaysDataset: optional array of datasets (same shape as `dataset`), one
 *   per day. When passed on the hourly view, the axis min/max is computed
 *   across ALL of these days instead of just the day currently shown, so the
 *   scale — and therefore the curve shapes — are directly comparable across
 *   days. If omitted, falls back to using just `dataset`.
 * - schoolStart / schoolEnd: "HH:MM" — shaded school-hours band (hourly view only)
 * - nowTime: "HH:MM" location time; showNow: draw the "now" line (selected day is today)
 *
 * metricInfo.id === "precip" draws chance (line, left axis, %) and amount
 * (bars, right axis, mm) together; dataset items carry `value` (chance) and
 * `valueSum` (amount).
 */
export default function WeatherChart({
    dataset,
    metricInfo,
    isHourly,
    allDaysDataset,
    schoolStart,
    schoolEnd,
    nowTime,
    showNow,
}) {
    const [hoveredIdx, setHoveredIdx] = useState(null);
    const svgRef = useRef(null);
    const wrapRef = useRef(null);
    // Measured size of the SVG wrapper. The viewBox is built from this
    // aspect ratio so the drawing always fills the wrapper. With a fixed
    // 500x110 viewBox the SVG letterboxes (xMidYMid meet) whenever the
    // wrapper is taller than that ratio, leaving empty bands above and below.
    const [box, setBox] = useState(null);
    const lang = useLanguage();
    const t = lang.modules.weather.chart;
    const metricNames = lang.modules.weather.metrics;

    useEffect(() => {
        const el = wrapRef.current;
        if (!el || typeof ResizeObserver === "undefined") return;
        const ro = new ResizeObserver(([entry]) => {
            const { width: w, height: h } = entry.contentRect;
            if (w > 0 && h > 0) {
                setBox((prev) =>
                    prev && Math.abs(prev.w - w) < 0.5 && Math.abs(prev.h - h) < 0.5
                        ? prev
                        : { w, h },
                );
            }
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, [dataset]);

    if (!dataset || dataset.length === 0) return null;

    const width = 500;
    // Height follows the wrapper's aspect ratio (falls back to 110 before the
    // first measurement). Text scales with width, so it looks the same as before.
    const height = box ? Math.max(50, Math.round(width * (box.h / box.w))) : 110;
    const paddingX = 0;
    const paddingTop = 8;
    // Bottom strip holds the hour labels (drawn at height - 3).
    const paddingBottom = 13;
    // Reserved space on the left for the max/mid/min value labels, so the
    // curve/line itself starts to the right of the text instead of under it.
    const paddingLeft = 26;

    const isDual = metricInfo.id === "temp" && !isHourly;
    const isPrecip = metricInfo.id === "precip";
    // Right strip for the amount (mm) axis labels of the combined precip chart.
    const paddingRight = isPrecip ? 22 : 0;
    const plotRight = width - paddingX - paddingRight;

    const valueLabelSize = 8

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
    const isPercent = metricInfo.unit === "%";
    const maxVal = isPercent
        ? Math.min(100, Math.ceil(rawMax + AXIS_PADDING))
        : Math.ceil(rawMax + AXIS_PADDING);
    // Only temperature can legitimately go below 0 — clamp everything else
    // (%, wind speed, etc.) so it never shows a negative axis label.
    // Percentage metrics (humidity, precipitation chance) additionally can
    // never exceed 100 on the high end (see maxVal above), so together the
    // axis for a % metric is always pinned to the 0–100 range.
    const clampedMinVal = metricInfo.id === "temp" ? minVal : isPercent ? 0 : Math.max(0, minVal);
    const valRange = maxVal - clampedMinVal === 0 ? 1 : maxVal - clampedMinVal;
    const midVal = Math.round((clampedMinVal + maxVal) / 2);

    const toPoints = (pickValue) =>
        dataset.map((d, idx) => {
            const x =
                paddingX +
                paddingLeft +
                (idx / (dataset.length - 1)) * (plotRight - paddingX - paddingLeft);
            const y =
                height -
                paddingBottom -
                ((pickValue(d) - clampedMinVal) / valRange) * (height - paddingTop - paddingBottom);
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

    // Amount (mm) axis for the combined precip chart — scaled over the same
    // source range as the chance axis so days stay comparable.
    const sumVals = isPrecip
        ? rangeSourceDatasets.flatMap((ds) => ds.map((d) => d.valueSum ?? 0))
        : [];
    const sumMax = isPrecip ? Math.max(1, Math.ceil(Math.max(...sumVals))) : 1;
    const sumMid = Math.round((sumMax / 2) * 10) / 10;
    const plotH = height - paddingTop - paddingBottom;
    const sumToY = (v) => height - paddingBottom - (Math.min(v, sumMax) / sumMax) * plotH;
    const barSlot = dataset.length > 1 ? (plotRight - paddingLeft) / (dataset.length - 1) : 10;
    const barW = Math.min(14, barSlot * 0.55);

    // Time markers (hourly view only): x is placed by clock time between the
    // first and last label of the dataset.
    const toMin = (hhmm) => {
        const m = /^(\d{1,2}):(\d{2})/.exec(hhmm || "");
        return m ? Number(m[1]) * 60 + Number(m[2]) : null;
    };
    const firstMin = isHourly ? toMin(dataset[0].label) : null;
    const lastMin = isHourly ? toMin(dataset[dataset.length - 1].label) : null;
    const canPlaceTimes = firstMin !== null && lastMin !== null && lastMin > firstMin;
    const minToX = (m) =>
        paddingLeft + ((m - firstMin) / (lastMin - firstMin)) * (plotRight - paddingLeft);

    let schoolBand = null;
    if (canPlaceTimes) {
        const a = toMin(schoolStart);
        const b = toMin(schoolEnd);
        if (a !== null && b !== null && b > a && b > firstMin && a < lastMin) {
            schoolBand = {
                x1: minToX(Math.max(a, firstMin)),
                x2: minToX(Math.min(b, lastMin)),
            };
        }
    }
    const nowMin = toMin(nowTime);
    const nowX =
        canPlaceTimes && showNow && nowMin !== null && nowMin >= firstMin && nowMin <= lastMin
            ? minToX(nowMin)
            : null;

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
        return `${pathD} L ${pts[pts.length - 1].x} ${height - paddingBottom} L ${pts[0].x} ${height - paddingBottom} Z`;
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

    // Top-left labels. Dual temp shows both lines (Max + Min); the combined
    // precip chart shows chance + amount; everything else keeps one label.
    const legendItems = isDual
        ? [
              { color: "#f87171", text: `${t.max} (${metricInfo.unit})` },
              { color: "#60a5fa", text: `${t.min} (${metricInfo.unit})` },
          ]
        : isPrecip
          ? [
                {
                    color: metricInfo.color,
                    text: `${metricNames[metricInfo.labelKey]} (${metricInfo.unit})`,
                },
                {
                    color: metricInfo.colorSecondary,
                    text: `${metricNames[metricInfo.labelKeySecondary]} (${metricInfo.unitSecondary})`,
                },
            ]
          : [
                {
                    color: metricInfo.color,
                    text: `${metricNames[metricInfo.labelKey]} (${metricInfo.unit})`,
                },
            ];

    return (
        <div className="weather-chart">
            <div className="weather-chart__header">
                <span className="weather-chart__title">
                    {legendItems.map((item) => (
                        <span key={item.text} className="weather-chart__legend-item">
                            <span
                                className="weather-chart__dot"
                                style={{
                                    backgroundColor: item.color,
                                    boxShadow: `0 0 calc(0.5 * var(--u)) ${item.color}`,
                                }}
                            ></span>
                            {item.text}
                        </span>
                    ))}
                </span>
                <span className="weather-chart__range">
                    {t.range}: {clampedMinVal}-{maxVal} {metricInfo.unit}
                    {isPrecip && ` · 0-${sumMax} ${metricInfo.unitSecondary}`}
                </span>
            </div>

            <div className="weather-chart__svg-wrap" ref={wrapRef}>
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
                        y1={paddingTop}
                        x2={plotRight}
                        y2={paddingTop}
                        stroke="rgba(255,255,255,0.05)"
                        strokeDasharray="2 2"
                    />
                    <line
                        x1={paddingX + paddingLeft}
                        y1={height - paddingBottom}
                        x2={plotRight}
                        y2={height - paddingBottom}
                        stroke="rgba(255,255,255,0.12)"
                    />

                    {/* Value-axis labels: max / mid / min — sit in the reserved
                        paddingLeft strip, clear of the curve/lines */}
                    <text
                        x={paddingX}
                        y={paddingTop + 3}
                        fill="rgba(255,255,255,0.35)"
                        fontFamily="JetBrains Mono, monospace"
                        fontSize={valueLabelSize}
                        textAnchor="start"
                    >
                        {maxVal}
                    </text>
                    <text
                        x={paddingX}
                        y={height / 2 + 3}
                        fill="rgba(255,255,255,0.35)"
                        fontFamily="JetBrains Mono, monospace"
                        fontSize={valueLabelSize}
                        textAnchor="start"
                    >
                        {midVal}
                    </text>
                    <text
                        x={paddingX}
                        y={height - paddingBottom - 2}
                        fill="rgba(255,255,255,0.35)"
                        fontFamily="JetBrains Mono, monospace"
                        fontSize={valueLabelSize}
                        textAnchor="start"
                    >
                        {clampedMinVal}
                    </text>

                    {isPrecip &&
                        [
                            [sumMax, paddingTop + 3],
                            [sumMid, height / 2 + 3],
                            [0, height - paddingBottom - 2],
                        ].map(([v, y]) => (
                            <text
                                key={y}
                                x={width}
                                y={y}
                                fill={metricInfo.colorSecondary}
                                fillOpacity="0.7"
                                fontFamily="JetBrains Mono, monospace"
                                fontSize={valueLabelSize}
                                textAnchor="end"
                            >
                                {v}
                            </text>
                        ))}

                    {/* School hours: shaded band between start and end */}
                    {schoolBand && (
                        <g>
                            <rect
                                x={schoolBand.x1}
                                y={paddingTop}
                                width={schoolBand.x2 - schoolBand.x1}
                                height={plotH}
                                fill="rgba(52,211,153,0.10)"
                            />
                            <line
                                x1={schoolBand.x1}
                                y1={paddingTop}
                                x2={schoolBand.x1}
                                y2={height - paddingBottom}
                                stroke="rgba(52,211,153,0.45)"
                                strokeDasharray="3 2"
                            />
                            <line
                                x1={schoolBand.x2}
                                y1={paddingTop}
                                x2={schoolBand.x2}
                                y2={height - paddingBottom}
                                stroke="rgba(52,211,153,0.45)"
                                strokeDasharray="3 2"
                            />
                            {schoolBand.x2 - schoolBand.x1 > 40 && (
                                <text
                                    x={schoolBand.x1 + 3}
                                    y={paddingTop + 8}
                                    fill="rgba(52,211,153,0.8)"
                                    fontFamily="JetBrains Mono, monospace"
                                    fontSize="0px"
                                >
                                    {t.school} {schoolStart}-{schoolEnd}
                                </text>
                            )}
                        </g>
                    )}

                    {/* Precipitation amount bars (behind the chance line) */}
                    {isPrecip &&
                        dataset.map((d, i) => {
                            const v = d.valueSum ?? 0;
                            if (v <= 0) return null;
                            const x = pointsSingle[i].x;
                            const y = sumToY(v);
                            return (
                                <rect
                                    key={i}
                                    x={x - barW / 2}
                                    y={y}
                                    width={barW}
                                    height={height - paddingBottom - y}
                                    rx="1"
                                    fill={metricInfo.colorSecondary}
                                    fillOpacity={hoveredIdx === i ? 0.9 : 0.55}
                                />
                            );
                        })}

                    {isDual ? (
                        <>
                            {areaMinD && <path d={areaMinD} fill="url(#grad-temp-min)" />}
                            {areaMaxD && <path d={areaMaxD} fill="url(#grad-temp-max)" />}
                        </>
                    ) : (
                        !isPrecip &&
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
                                        filter: "drop-shadow(0 var(--hairline) calc(0.25 * var(--u)) rgba(96, 165, 250, 0.2))",
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
                                        filter: "drop-shadow(0 var(--hairline) calc(0.25 * var(--u)) rgba(248, 113, 113, 0.2))",
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
                                style={{
                                    filter: `drop-shadow(0 var(--hairline) calc(0.25 * var(--u)) ${metricInfo.color}30)`,
                                }}
                            />
                        )
                    )}

                    {/* Current time */}
                    {nowX !== null && (
                        <g>
                            <line
                                x1={nowX}
                                y1={paddingTop - 2}
                                x2={nowX}
                                y2={height - paddingBottom}
                                stroke="#fbbf24"
                                strokeWidth="1.5"
                            />
                            <circle cx={nowX} cy={paddingTop - 2} r="2.5" fill="#fbbf24" />
                            <text
                                x={nowX}
                                y={paddingTop - 5}
                                fill="#fbbf24"
                                fontFamily="JetBrains Mono, monospace"
                                fontSize="10px"
                                textAnchor={nowX > width - 30 ? "end" : "middle"}
                            >
                                {nowTime}
                            </text>
                        </g>
                    )}

                    {renderPoints.map((pt, idx) => {
                        const isHovered = hoveredIdx === pt.origIdx;
                        return (
                            <g key={idx}>
                                {isHovered && (
                                    <line
                                        x1={pt.x}
                                        y1={paddingTop}
                                        x2={pt.x}
                                        y2={height - paddingBottom}
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
                                        fontSize={valueLabelSize}
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
                        width={plotRight - paddingX - paddingLeft}
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
                        ) : isPrecip ? (
                            <div className="weather-chart__tooltip-dual">
                                <div className="weather-chart__tooltip-row">
                                    <span
                                        className="weather-chart__tooltip-swatch"
                                        style={{ backgroundColor: metricInfo.color }}
                                    ></span>
                                    <span className="weather-chart__tooltip-name">
                                        {metricNames[metricInfo.labelKey]}:
                                    </span>
                                    <span className="weather-chart__tooltip-num">
                                        {dataset[hoveredIdx].value}%
                                    </span>
                                </div>
                                <div className="weather-chart__tooltip-row">
                                    <span
                                        className="weather-chart__tooltip-swatch"
                                        style={{ backgroundColor: metricInfo.colorSecondary }}
                                    ></span>
                                    <span className="weather-chart__tooltip-name">
                                        {metricNames[metricInfo.labelKeySecondary]}:
                                    </span>
                                    <span className="weather-chart__tooltip-num">
                                        {dataset[hoveredIdx].valueSum ?? 0}mm
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
