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
// Width reserved for each right-hand axis's labels.
const RIGHT_AXIS_W = 22;
// ─────────────────────────────────────────────────────────────────────────

/**
 * Props:
 * - dataset: [{ label, item }] — `item` is the hourly/daily item; the lines to
 *   draw (and which item field each reads) come from metricInfo.lines /
 *   metricInfo.dailyLines (see METRIC_DEFS in weatherHelpers.jsx)
 * - metricInfo: { id, color, unit, lines, dailyLines?, allowNegative? }
 * - isHourly: boolean — picks metricInfo.lines vs metricInfo.dailyLines
 * - allDaysDataset: optional array of datasets (same shape as `dataset`), one
 *   per day. When passed on the hourly view, the axis min/max is computed
 *   across ALL of these days instead of just the day currently shown, so the
 *   scale — and therefore the curve shapes — are directly comparable across
 *   days. If omitted, falls back to using just `dataset`.
 * - schoolStart / schoolEnd: "HH:MM" — shaded school-hours band (hourly view only)
 * - nowTime: "HH:MM" location time; showNow: draw the "now" line (selected day is today)
 *
 * Lines with a `toggle` id are optional: hidden until the viewer turns on the
 * matching legend button (metricInfo.toggles). Lines with `kind: "bar"` are
 * drawn as bars from 0.
 *
 * metricInfo.id === "precip" draws chance (line, left axis, %) and amount
 * (bars, right axis, mm) together; the amount is read from item.precipSum.
 *
 * A line with an `axis` other than "left" (dew point, visibility) gets its own
 * right-hand axis, scaled independently of the left one.
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
    // Which optional series (feels-like, gusts, dew point, visibility) are
    // switched on, keyed by toggle id. All start hidden.
    const [shown, setShown] = useState({});
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

    const isPrecip = metricInfo.id === "precip";
    // Lines to draw: the daily view may use its own set (e.g. temp = max/min
    // of both temperature and feels-like).
    const allLineDefs = (!isHourly && metricInfo.dailyLines) || metricInfo.lines || [];
    // Optional lines only draw once the viewer switches them on.
    const toggles = (metricInfo.toggles || []).filter((tg) =>
        allLineDefs.some((l) => l.toggle === tg.id),
    );
    const lineDefs = allLineDefs.filter((l) => !l.toggle || shown[l.toggle]);
    const axisOf = (l) => l.axis ?? "left";
    const rightAxisNames = [...new Set(lineDefs.map(axisOf).filter((a) => a !== "left"))];

    // One right-hand label strip per right axis (precip amount counts as one).
    const rightStrips = rightAxisNames.length + (isPrecip ? 1 : 0);
    const paddingRight = rightStrips * RIGHT_AXIS_W;
    const plotRight = width - paddingX - paddingRight;

    const valueLabelSize = 8;

    // For the hourly view, pull values from every day (when provided) so the
    // axis range reflects the whole week, not just whichever day is showing.
    // This is what makes the curve shapes directly comparable when clicking
    // between days — the scale doesn't jump around per-day.
    const rangeSourceDatasets =
        isHourly && allDaysDataset && allDaysDataset.length > 0 ? allDaysDataset : [dataset];

    const valueOf = (d, key) => {
        const v = d.item?.[key];
        return typeof v === "number" && Number.isFinite(v) ? v : null;
    };

    // Axis ranges come from ALL of the chart's lines, including optional ones
    // that are currently switched off, so the min/max labels stay put when a
    // line is toggled on or off.
    const valuesOnAxis = (axis) =>
        rangeSourceDatasets
            .flatMap((ds) =>
                ds.flatMap((d) =>
                    allLineDefs.filter((l) => axisOf(l) === axis).map((l) => valueOf(d, l.key)),
                ),
            )
            .filter((v) => v !== null);

    // ── Left axis ────────────────────────────────────────────────────────
    const leftVals = valuesOnAxis("left");
    const rawMin = leftVals.length ? Math.min(...leftVals) : 0;
    const rawMax = leftVals.length ? Math.max(...leftVals) : 0;

    // Round to whole numbers with a bit of padding, rather than snapping to
    // multiples of 5/10 — so the axis shows plain values like 21, 22, 34, 36.
    const minVal = Math.floor(rawMin - AXIS_PADDING);
    const isPercent = metricInfo.unit === "%";
    // Percentage metrics (humidity, precipitation chance) always use the full
    // 0-100 axis, regardless of the week's actual min/max.
    const maxVal = isPercent ? 100 : Math.ceil(rawMax + AXIS_PADDING);
    // Bars always start at 0 (a bar that starts mid-axis misleads). Only
    // temperature-like metrics (temp, feels-like) can legitimately go below
    // 0 — clamp everything else so it never shows a negative axis label.
    const hasLeftBars = allLineDefs.some((l) => l.kind === "bar" && axisOf(l) === "left");
    const clampedMinVal = hasLeftBars
        ? 0
        : metricInfo.allowNegative
          ? minVal
          : isPercent
            ? 0
            : Math.max(0, minVal);
    const valRange = maxVal - clampedMinVal === 0 ? 1 : maxVal - clampedMinVal;
    const midVal = Math.round((clampedMinVal + maxVal) / 2);

    const plotH = height - paddingTop - paddingBottom;
    const yLeft = (v) => height - paddingBottom - ((v - clampedMinVal) / valRange) * plotH;

    // ── Right axes ───────────────────────────────────────────────────────
    // Precip: amount (mm) for the bars, scaled over the same source range as
    // the chance axis so days stay comparable. Then one axis per named
    // right-hand axis (dew point °C, visibility km, ...).
    const rightAxes = [];
    if (isPrecip) {
        const sumVals = rangeSourceDatasets.flatMap((ds) => ds.map((d) => d.item?.precipSum ?? 0));
        const sumMax = Math.max(1, Math.ceil(Math.max(...sumVals)));
        rightAxes.push({
            name: "precip",
            min: 0,
            max: sumMax,
            mid: Math.round((sumMax / 2) * 10) / 10,
            color: metricInfo.colorSecondary,
            unit: metricInfo.unitSecondary,
        });
    }
    rightAxisNames.forEach((name) => {
        const axisLines = allLineDefs.filter((l) => l.axis === name);
        const vals = valuesOnAxis(name);
        const minRaw = vals.length ? Math.floor(Math.min(...vals) - AXIS_PADDING) : 0;
        const rMin = axisLines.some((l) => l.allowNegative) ? minRaw : Math.max(0, minRaw);
        const maxRaw = vals.length ? Math.ceil(Math.max(...vals) + AXIS_PADDING) : rMin + 1;
        const rMax = maxRaw > rMin ? maxRaw : rMin + 1;
        rightAxes.push({
            name,
            min: rMin,
            max: rMax,
            mid: Math.round((rMin + rMax) / 2),
            color: axisLines[0].color,
            unit: axisLines[0].unit ?? metricInfo.unit,
        });
    });
    const axisByName = Object.fromEntries(rightAxes.map((a) => [a.name, a]));
    const yOnRight = (axis, v) =>
        height - paddingBottom - ((v - axis.min) / (axis.max - axis.min || 1)) * plotH;

    // Precip bars (amount) — drawn against the precip right axis.
    const precipAxis = axisByName.precip;
    const sumToY = (v) =>
        height -
        paddingBottom -
        (Math.min(v, precipAxis?.max ?? 1) / (precipAxis?.max || 1)) * plotH;
    const barSlot = dataset.length > 1 ? (plotRight - paddingLeft) / (dataset.length - 1) : 10;
    const barW = Math.min(14, barSlot * 0.55);

    const xAt = (idx) =>
        paddingX +
        paddingLeft +
        (dataset.length > 1 ? idx / (dataset.length - 1) : 0) *
            (plotRight - paddingX - paddingLeft);

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

    // One entry per drawn line, with its points (missing values are skipped).
    const lines = lineDefs.map((def) => {
        const axis = axisOf(def);
        const toY = axis === "left" ? yLeft : (v) => yOnRight(axisByName[axis], v);
        const isBar = def.kind === "bar";
        const pts = dataset
            .map((d, idx) => {
                const v = valueOf(d, def.key);
                return v === null ? null : { x: xAt(idx), y: toY(v), value: v, idx };
            })
            .filter(Boolean);
        const pathD = isBar ? "" : getBezierPath(pts);
        return {
            ...def,
            axis,
            isBar,
            unit: def.unit ?? metricInfo.unit,
            pts,
            pathD,
            areaD: def.fill && !isBar ? getAreaPath(pts, pathD) : "",
        };
    });

    // Shared x-grid used for hit-testing mouse position.
    const xGridPoints = dataset.map((_, i) => ({ x: xAt(i) }));

    // Dots are only ever shown on the daily (7-day) view. On the hourly view
    // there are too many points for individual dots to read well, so only
    // the hover indicator (vertical line + tooltip) is used instead.
    const showDots = !isHourly;

    const nameOf = (nameKey) => t[nameKey] ?? metricNames[nameKey] ?? nameKey;

    // Legend entries for the always-on lines. Optional lines get a toggle
    // button instead (below). Show the unit on an entry only when it helps:
    // few lines, or lines with different units — the range text has it too.
    const legendLines = lines.filter((l) => !l.toggle);
    const showLegendUnit =
        legendLines.length <= 2 || new Set(legendLines.map((l) => l.unit)).size > 1;
    const unitInParens = (unit) => (unit ? ` (${unit})` : "");

    const legendItems = [
        ...legendLines.map((l) => ({
            color: l.color,
            text: `${nameOf(l.nameKey)}${showLegendUnit ? unitInParens(l.unit) : ""}`,
        })),
        ...(isPrecip
            ? [
                  {
                      color: metricInfo.colorSecondary,
                      text: `${metricNames[metricInfo.labelKeySecondary]} (${metricInfo.unitSecondary})`,
                  },
              ]
            : []),
    ];

    const toggleSeries = (id) => setShown((prev) => ({ ...prev, [id]: !prev[id] }));

    const unitSuffix = metricInfo.unit ? ` ${metricInfo.unit}` : "";
    const rangeText =
        `${t.range}: ${clampedMinVal}-${maxVal}${unitSuffix}` +
        rightAxes.map((a) => ` · ${a.min}-${a.max} ${a.unit}`).join("");

    // Tooltip position follows the average height of the hovered column's points.
    const hoveredYs =
        hoveredIdx !== null
            ? lines
                  .map((l) => l.pts.find((p) => p.idx === hoveredIdx)?.y)
                  .filter((y) => y !== undefined)
            : [];
    const hoveredY = hoveredYs.length
        ? hoveredYs.reduce((a, b) => a + b, 0) / hoveredYs.length
        : height / 2;

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

    const axisLabelStyle = {
        fontFamily: "JetBrains Mono, monospace",
        fontSize: valueLabelSize,
    };
    const fmt = (v) => (v === null || v === undefined ? "--" : v);

    // Gradient defs, one per distinct filled-line colour.
    const gradientColors = [
        ...new Set(lines.filter((l) => l.fill && !l.isBar).map((l) => l.color)),
    ];
    const gradId = (color) => `grad-${color.replace("#", "")}`;

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
                    {toggles.map((tg) => {
                        const on = Boolean(shown[tg.id]);
                        return (
                            <button
                                key={tg.id}
                                type="button"
                                aria-pressed={on}
                                className={`weather-chart__toggle${on ? " weather-chart__toggle--on" : ""}`}
                                onClick={() => toggleSeries(tg.id)}
                            >
                                <span
                                    className="weather-chart__dot"
                                    style={{
                                        backgroundColor: tg.color,
                                        opacity: on ? 1 : 0.45,
                                        boxShadow: on
                                            ? `0 0 calc(0.5 * var(--u)) ${tg.color}`
                                            : "none",
                                    }}
                                ></span>
                                {nameOf(tg.nameKey)}
                                {unitInParens(tg.unit)}
                            </button>
                        );
                    })}
                </span>
                <span className="weather-chart__range">{rangeText}</span>
            </div>

            <div className="weather-chart__svg-wrap" ref={wrapRef}>
                <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="weather-chart__svg">
                    <defs>
                        {gradientColors.map((color) => (
                            <linearGradient
                                key={color}
                                id={gradId(color)}
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                                <stop offset="100%" stopColor={color} stopOpacity="0.0" />
                            </linearGradient>
                        ))}
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
                        {...axisLabelStyle}
                        textAnchor="start"
                    >
                        {maxVal}
                    </text>
                    <text
                        x={paddingX}
                        y={paddingTop + plotH / 2 + 3}
                        fill="rgba(255,255,255,0.35)"
                        {...axisLabelStyle}
                        textAnchor="start"
                    >
                        {midVal}
                    </text>
                    <text
                        x={paddingX}
                        y={height - paddingBottom - 2}
                        fill="rgba(255,255,255,0.35)"
                        {...axisLabelStyle}
                        textAnchor="start"
                    >
                        {clampedMinVal}
                    </text>

                    {/* Right-hand axis labels (precip amount, dew point, visibility),
                        one strip per axis, side by side */}
                    {rightAxes.map((axis, i) =>
                        [
                            [axis.max, paddingTop + 3],
                            [axis.mid, paddingTop + plotH / 2 + 3],
                            [axis.min, height - paddingBottom - 2],
                        ].map(([v, y]) => (
                            <text
                                key={`${axis.name}-${y}`}
                                x={plotRight + RIGHT_AXIS_W * (i + 1)}
                                y={y}
                                fill={axis.color}
                                fillOpacity="0.7"
                                {...axisLabelStyle}
                                textAnchor="end"
                            >
                                {v}
                            </text>
                        )),
                    )}

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
                            const v = d.item?.precipSum ?? 0;
                            if (v <= 0) return null;
                            const x = xAt(i);
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

                    {/* Bar series (e.g. UV index), from the axis baseline up */}
                    {lines
                        .filter((l) => l.isBar)
                        .flatMap((l) =>
                            l.pts.map((p) => (
                                <rect
                                    key={`bar-${l.key}-${p.idx}`}
                                    x={p.x - barW / 2}
                                    y={p.y}
                                    width={barW}
                                    height={Math.max(0, height - paddingBottom - p.y)}
                                    rx="1"
                                    fill={l.color}
                                    fillOpacity={hoveredIdx === p.idx ? 0.95 : 0.65}
                                />
                            )),
                        )}

                    {/* Area fills (primary lines only) */}
                    {lines.map(
                        (l) =>
                            l.areaD && (
                                <path
                                    key={`area-${l.key}`}
                                    d={l.areaD}
                                    fill={`url(#${gradId(l.color)})`}
                                />
                            ),
                    )}

                    {/* Lines — later entries (lighter feels-like / gust lines) draw on top */}
                    {lines.map(
                        (l) =>
                            l.pathD && (
                                <path
                                    key={`line-${l.key}`}
                                    d={l.pathD}
                                    fill="none"
                                    stroke={l.color}
                                    strokeWidth={l.toggle ? "1.25" : "2"}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{
                                        filter: `drop-shadow(0 var(--hairline) calc(0.25 * var(--u)) ${l.color}30)`,
                                    }}
                                />
                            ),
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

                    {/* Hover indicator */}
                    {hoveredIdx !== null && xGridPoints[hoveredIdx] && (
                        <line
                            x1={xGridPoints[hoveredIdx].x}
                            y1={paddingTop}
                            x2={xGridPoints[hoveredIdx].x}
                            y2={height - paddingBottom}
                            stroke="rgba(255,255,255,0.15)"
                            strokeDasharray="2 2"
                        />
                    )}

                    {/* Dots (daily view only) */}
                    {showDots &&
                        lines
                            .filter((l) => !l.isBar)
                            .flatMap((l) =>
                                l.pts.map((p) => {
                                    const isHovered = hoveredIdx === p.idx;
                                    return (
                                        <g key={`dot-${l.key}-${p.idx}`}>
                                            {isHovered && (
                                                <circle
                                                    cx={p.x}
                                                    cy={p.y}
                                                    r="6"
                                                    fill={l.color}
                                                    opacity="0.3"
                                                />
                                            )}
                                            <circle
                                                cx={p.x}
                                                cy={p.y}
                                                r={isHovered ? "4" : "2.5"}
                                                fill={isHovered ? "#fff" : l.color}
                                                stroke={isHovered ? l.color : "rgba(0,0,0,0.4)"}
                                                strokeWidth="1.2"
                                                style={{ transition: "all 0.1s ease" }}
                                            />
                                        </g>
                                    );
                                }),
                            )}

                    {/* X-axis labels */}
                    {dataset.map((d, i) => (
                        <text
                            key={`x-${i}`}
                            x={xAt(i)}
                            y={height - 3}
                            fill="rgba(255,255,255,0.4)"
                            {...axisLabelStyle}
                            textAnchor="middle"
                        >
                            {d.label.slice(0, 2)}
                        </text>
                    ))}

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
                            left: `${Math.min(85, Math.max(3, (xGridPoints[hoveredIdx].x / width) * 100 - 8))}%`,
                            top: `${Math.min(65, Math.max(2, (hoveredY / height) * 100 - 32))}%`,
                        }}
                    >
                        <div className="weather-chart__tooltip-label">
                            {dataset[hoveredIdx].label}
                        </div>
                        {lines.length === 1 && !isPrecip ? (
                            <div className="weather-chart__tooltip-single">
                                <span className="weather-chart__tooltip-num">
                                    {fmt(valueOf(dataset[hoveredIdx], lines[0].key))}
                                    {lines[0].unit}
                                </span>
                            </div>
                        ) : (
                            <div className="weather-chart__tooltip-dual">
                                {lines.map((l) => {
                                    const v = valueOf(dataset[hoveredIdx], l.key);
                                    return (
                                        <div key={l.key} className="weather-chart__tooltip-row">
                                            <span
                                                className="weather-chart__tooltip-swatch"
                                                style={{ backgroundColor: l.color }}
                                            ></span>
                                            <span className="weather-chart__tooltip-name">
                                                {nameOf(l.nameKey)}:
                                            </span>
                                            <span className="weather-chart__tooltip-num">
                                                {fmt(v)}
                                                {v === null ? "" : l.unit}
                                            </span>
                                        </div>
                                    );
                                })}
                                {isPrecip && (
                                    <div className="weather-chart__tooltip-row">
                                        <span
                                            className="weather-chart__tooltip-swatch"
                                            style={{ backgroundColor: metricInfo.colorSecondary }}
                                        ></span>
                                        <span className="weather-chart__tooltip-name">
                                            {metricNames[metricInfo.labelKeySecondary]}:
                                        </span>
                                        <span className="weather-chart__tooltip-num">
                                            {dataset[hoveredIdx].item?.precipSum ?? 0}mm
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
