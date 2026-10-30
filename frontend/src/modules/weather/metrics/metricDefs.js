// ===================================================
// ファイル名: metricDefs.js
// 作成日: 2026/10/27
// 概要: 天気ページの指標（タイル／カード共通）の静的な定義
//       色・ゲージ範囲・既定の表示形式など、天気データに依存しない情報だけを持つ。
//       実際の値・単位換算は buildMetrics.jsx が作る。
// ===================================================

export const TILE_DISPLAYS = ["graph", "gauge"];
export const CARD_STYLES = ["line", "area", "bar", "gauge"];

// A card draws on two Y axes at most (left / right), so its non-gauge metrics
// may use at most this many distinct `axis` groups.
export const MAX_CARD_AXES = 2;
export const MAX_CARD_METRICS = 4;

/**
 * axis        — metrics with the same axis group share a Y axis (same unit)
 * range       — gauge range [lo, hi] in SI units (°C, hPa, mm, m/s, km, m ...)
 * display     — default tile bottom part: "graph" | "gauge"
 * style       — default chart style inside a card: "line" | "area" | "bar"
 * color       — chart colour; accent — tile LED / sparkline colour (defaults to color)
 * short       — short legend label inside charts (literal, not translated)
 * fixedDomain — Y-axis range that never changes (display units)
 */
export const METRIC_DEFS = {
    temperature: {
        axis: "temp",
        range: [-10, 40],
        display: "graph",
        style: "area",
        color: "#fb923c",
        short: "T",
        extrema: true,
    },
    feelsLike: {
        axis: "temp",
        range: [-10, 40],
        display: "graph",
        style: "line",
        color: "var(--color-accent)",
        accent: "#fb923c",
        short: "Feels",
        dashed: true,
    },
    dewPoint: {
        axis: "temp",
        range: [-10, 30],
        display: "graph",
        style: "line",
        color: "#38bdf8",
        short: "Td",
    },
    wetBulb: {
        axis: "temp",
        range: [0, 35],
        display: "gauge",
        style: "line",
        color: "#38bdf8",
        short: "Tw",
    },
    wbgt: {
        axis: "temp",
        range: [10, 35],
        display: "gauge",
        style: "line",
        color: "#fb923c",
        short: "WBGT",
    },
    humidity: {
        axis: "pct",
        range: [0, 100],
        display: "graph",
        style: "area",
        color: "#38bdf8",
        short: "RH",
        fixedDomain: [0, 100],
    },
    cloud: {
        axis: "pct",
        range: [0, 100],
        display: "graph",
        style: "bar",
        color: "var(--color-text-muted)",
        short: "Cloud",
        barOpacity: 0.25,
        fixedDomain: [0, 100],
    },
    precip: {
        axis: "precip",
        range: [0, 10],
        display: "graph",
        style: "bar",
        color: "#60a5fa",
        short: "Precip",
        nonNegative: true,
    },
    precipProb: {
        axis: "pct",
        range: [0, 100],
        display: "graph",
        style: "line",
        color: "var(--color-text-secondary)",
        accent: "#60a5fa",
        short: "Prob",
        dashed: true,
        nonNegative: true,
        fixedDomain: [0, 100],
    },
    pressure: {
        axis: "pressure",
        range: [980, 1040],
        display: "graph",
        style: "area",
        color: "#a78bfa",
        short: "MSL",
        extrema: true,
    },
    windSpeed: {
        axis: "wind",
        range: [0, 20],
        display: "graph",
        style: "area",
        color: "#34d399",
        short: "Wind",
        nonNegative: true,
    },
    windGust: {
        axis: "wind",
        range: [0, 30],
        display: "graph",
        style: "line",
        color: "#fbbf24",
        short: "Gust",
        dashed: true,
        nonNegative: true,
    },
    uv: {
        axis: "uv",
        range: [0, 11],
        display: "gauge",
        style: "area",
        color: "#f472b6",
        short: "UV",
        nonNegative: true,
    },
    cape: {
        axis: "cape",
        range: [0, 2500],
        display: "gauge",
        style: "line",
        color: "#f87171",
        short: "CAPE",
        nonNegative: true,
    },
    visibility: {
        axis: "dist",
        range: [0, 20],
        display: "graph",
        style: "area",
        color: "#94a3b8",
        short: "Vis",
        nonNegative: true,
    },
    freezing: {
        axis: "alt",
        range: [0, 5000],
        display: "graph",
        style: "area",
        color: "#67e8f9",
        short: "0°C",
    },
};

// Order used by the pickers.
export const METRIC_IDS = Object.keys(METRIC_DEFS);

export const isMetricId = (id) => Object.hasOwn(METRIC_DEFS, id);

/** Distinct Y-axis groups used by a card's non-gauge metrics. */
export function cardAxes(rows) {
    return new Set(
        rows
            .filter((r) => r.style !== "gauge" && isMetricId(r.id))
            .map((r) => METRIC_DEFS[r.id].axis),
    );
}

/** Would these rows still fit on a card's two Y axes? */
export const cardAxesFit = (rows) => cardAxes(rows).size <= MAX_CARD_AXES;
