// ===================================================
// ファイル名: moduleSizes.js
// 概要: モジュールごと・表示モードごとの最小セルサイズ定義
// ===================================================

// Minimum comfortable cell-span ({ w, h }, in grid cells) for each module
// type's view mode. This is a floor for auto-growing on a view change —
// never a target. A module the user has already sized at or above the
// floor is left exactly as it is; only a module that would otherwise be
// too small for the newly chosen view is grown to fit it.
//
// Tune the numbers here — nothing else needs to change. Unknown types or
// views fall back to 1x1 (no growth).
//
// View keys:
//   weather      -> settings.view: "combined" | "current" | "forecast"
//   announcement -> settings.view: "compact"  | "extended"
//   schedule     -> calendar layout: "month"  | "week"
//   transit      -> settings.view: "board" | "line"
export const MODULE_MIN_SIZES = {
    weather: {
        combined: { w: 2, h: 2 },
        current: { w: 1, h: 1 },
        forecast: { w: 2, h: 2 },
    },
    announcement: {
        compact: { w: 1, h: 1 },
        extended: { w: 1, h: 2 },
    },
    schedule: {
        month: { w: 2, h: 2 },
        week: { w: 1, h: 2 },
    },
    transit: {
        board: { w: 1, h: 2 },
        line: { w: 2, h: 2 },
    },
};

const FALLBACK_MIN = { w: 1, h: 1 };

export function getMinSize(type, view) {
    return MODULE_MIN_SIZES[type]?.[view] ?? FALLBACK_MIN;
}

/**
 * Returns the { w, h } a module should grow to so it meets `min`, or null
 * when it already does (the common case — no request is sent at all).
 * Only ever grows a dimension, never shrinks one, and never asks for more
 * than the grid itself can hold.
 */
export function growToMinSize(current, min, columns, rows) {
    const w = current?.w ?? 1;
    const h = current?.h ?? 1;
    const nextW = Math.max(w, Math.min(min.w, columns));
    const nextH = Math.max(h, Math.min(min.h, rows));
    if (nextW === w && nextH === h) return null;
    return { w: nextW, h: nextH };
}
