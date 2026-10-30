// ===================================================
// ファイル名: graphStyle.js
// 作成日: 2026/10/30
// 概要: 天気ページのグラフ線スタイル（太さ・なめらかさ・塗りの濃さ）の定義と検証。
//       ページ全体の設定は preferences.weatherGraph に、モジュールごとの上書きは
//       レイアウトの config.graph（変更した項目だけを持つ）に保存する。
//       描画側は resolveGraph(全体設定, 上書き) で最終的な値を得る。
//       保存済みの値が壊れていても、sanitize 系の関数が安全な値に直す。
// ===================================================

/**
 * lineWidth   — chart line width in px (sparklines draw at 75% of it)
 * smoothness  — 0 = straight segments, 1 = fully rounded curve
 * fillOpacity — strength of the area fill, 1 = the original look
 */
export const GRAPH_DEFAULTS = { lineWidth: 2, smoothness: 0, fillOpacity: 1 };

export const GRAPH_LIMITS = {
    lineWidth: { min: 0.5, max: 5, step: 0.5 },
    smoothness: { min: 0, max: 1, step: 0.1 },
    fillOpacity: { min: 0, max: 2, step: 0.1 },
};

export const GRAPH_KEYS = Object.keys(GRAPH_DEFAULTS);

const HEX = /^#[0-9a-f]{6}$/i;
export const isHexColor = (v) => typeof v === "string" && HEX.test(v);

// A valid, clamped, step-snapped number — or null when `raw` is not usable.
function clean(key, raw) {
    if (typeof raw !== "number" || !Number.isFinite(raw)) return null;
    const { min, max, step } = GRAPH_LIMITS[key];
    const snapped = Math.round(Math.min(max, Math.max(min, raw)) / step) * step;
    return +snapped.toFixed(2);
}

/** The page-wide settings: every key present, bad / missing ones replaced by the default. */
export function sanitizeGraph(raw) {
    const c = raw && typeof raw === "object" ? raw : {};
    return Object.fromEntries(GRAPH_KEYS.map((k) => [k, clean(k, c[k]) ?? GRAPH_DEFAULTS[k]]));
}

/** A module's overrides: only the valid keys it sets, or null when it overrides nothing. */
export function sanitizeGraphOverride(raw) {
    if (!raw || typeof raw !== "object") return null;
    const out = {};
    for (const k of GRAPH_KEYS) {
        const v = clean(k, raw[k]);
        if (v !== null) out[k] = v;
    }
    return Object.keys(out).length > 0 ? out : null;
}

/** What a module actually draws with: the global settings, then its own overrides on top. */
export const resolveGraph = (global = GRAPH_DEFAULTS, override) => ({
    ...global,
    ...(override ?? {}),
});
