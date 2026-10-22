// ===================================================
// ファイル名: themeGenerator.js
// 概要: 少数のベースカラーから全テーマカラー(シェード)を生成する
//       Normal モードと、Advanced モードの自動シェード連動で共用
// ===================================================

import { adjustLightness, isLightColor, mixColors, parseColor, withAlpha } from "./colorUtils";

// Baselines used when a base color is missing or still mid-typing.
export const FALLBACK_PALETTE = {
    accent: "#7c3aed",
    bg: "#090b13",
    text: "#f8fafc",
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#ef4444",
};

export const BASE_PRESETS = {
    dark: { bg: "#090b13", text: "#f8fafc" },
    light: { bg: "#f8fafc", text: "#0f172a" },
};

export const DEFAULT_TUNING = { contrast: 1, border: 1, shadow: 1 };

// The six colors everything else is derived from.
export const BASE_KEYS = ["accent", "bg", "text", "success", "warning", "error"];

// base key -> the colors that are shades of it. Several of these live in
// other groups on purpose (e.g. elementSelected is an accent tint, input
// backgrounds are background shades).
export const FOLLOWERS = {
    accent: [
        "accentHover",
        "accentActive",
        "accentMuted",
        "accentBorder",
        "elementSelected",
        "borderHover",
        "borderActive",
        "borderFocus",
        "textAccent",
    ],
    bg: [
        "bgElevated",
        "surface",
        "surfaceElevated",
        "surfaceFloating",
        "element",
        "elementHover",
        "elementActive",
        "inputBg",
        "inputHover",
        "inputFocus",
        "inputDisabled",
    ],
    text: ["textSecondary", "textMuted", "textDisabled", "elementDisabled", "border"],
    success: ["successHover"],
    warning: ["warningHover"],
    error: ["errorHover"],
};

// follower key -> base key (inverse of FOLLOWERS)
export const FOLLOWS = Object.fromEntries(
    Object.entries(FOLLOWERS).flatMap(([base, keys]) => keys.map((key) => [key, base])),
);

const clamp01 = (n) => Math.min(1, Math.max(0, n));

export function paletteFromColors(colors = {}) {
    const palette = {};
    BASE_KEYS.forEach((key) => {
        palette[key] = parseColor(colors[key]) ? colors[key] : FALLBACK_PALETTE[key];
    });
    return palette;
}

export function generateColors(palette, tuning = DEFAULT_TUNING) {
    const p = paletteFromColors(palette);
    const { accent, bg, text, success, warning, error } = p;
    const dark = !isLightColor(bg);
    const c = tuning.contrast ?? 1;

    // ---- accent ----
    const accentHover = adjustLightness(accent, dark ? 8 : -7);
    const accentActive = adjustLightness(accent, dark ? -7 : -14);

    // ---- surfaces: dark themes get lighter layers, light themes get
    // a white "raised" layer and slightly darker "recessed" layers ----
    const white = "#ffffff";
    const bgElevated = dark ? adjustLightness(bg, 3 * c) : mixColors(bg, white, 0.9);
    const surface = dark ? adjustLightness(bg, 6.5 * c) : adjustLightness(bg, -2.5 * c);
    const surfaceElevated = dark ? adjustLightness(bg, 10 * c) : adjustLightness(bg, -7 * c);
    const surfaceFloating = dark ? adjustLightness(bg, 14 * c) : mixColors(bg, white, 0.9);

    // ---- elements ----
    const element = dark ? surface : bgElevated;
    const elementHover = dark ? mixColors(surface, surfaceElevated, 0.45) : surface;
    const elementActive = surfaceElevated;

    return {
        accent,
        accentHover,
        accentActive,
        accentMuted: withAlpha(accent, dark ? 0.15 : 0.12),
        accentBorder: withAlpha(accent, dark ? 0.35 : 0.3),

        bg,
        bgElevated,
        surface,
        surfaceElevated,
        surfaceFloating,

        element,
        elementHover,
        elementActive,
        elementSelected: withAlpha(accent, dark ? 0.18 : 0.12),
        elementDisabled: withAlpha(text, dark ? 0.04 : 0.05),

        border: withAlpha(text, clamp01((dark ? 0.08 : 0.12) * (tuning.border ?? 1))),
        borderHover: withAlpha(accent, 0.35),
        borderActive: withAlpha(accent, dark ? 0.65 : 0.6),
        borderFocus: dark ? accentHover : accent,

        text,
        textSecondary: mixColors(text, bg, dark ? 0.3 : 0.2),
        textMuted: mixColors(text, bg, dark ? 0.52 : 0.38),
        textDisabled: mixColors(text, bg, dark ? 0.68 : 0.58),
        textAccent: dark ? adjustLightness(accent, 16) : accent,

        inputBg: dark ? bgElevated : white,
        inputHover: dark ? surface : bg,
        inputFocus: dark ? surfaceElevated : white,
        inputDisabled: dark ? bg : surfaceElevated,

        success,
        successHover: adjustLightness(success, -8),
        warning,
        warningHover: adjustLightness(warning, -8),
        error,
        errorHover: adjustLightness(error, -8),
    };
}

export function generateShadows(palette, tuning = DEFAULT_TUNING) {
    const dark = !isLightColor(paletteFromColors(palette).bg);
    const k = tuning.shadow ?? 1;
    const alpha = (a) => Math.round(clamp01(a * k) * 100) / 100;
    const [sm, md, lg] = dark ? [0.25, 0.35, 0.45] : [0.08, 0.12, 0.16];

    return {
        sm: `0 2px 8px rgba(0,0,0,${alpha(sm)})`,
        md: `0 8px 24px rgba(0,0,0,${alpha(md)})`,
        lg: `0 16px 40px rgba(0,0,0,${alpha(lg)})`,
    };
}
