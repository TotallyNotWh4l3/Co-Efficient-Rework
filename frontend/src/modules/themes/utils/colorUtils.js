export const HEX_COLOR_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function hexToRgb(hex) {
    if (!HEX_COLOR_PATTERN.test(hex ?? "")) return null;
    let h = hex.slice(1);
    if (h.length === 3) {
        h = h
            .split("")
            .map((c) => c + c)
            .join("");
    }
    const num = parseInt(h, 16);
    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255,
    };
}

export function parseRgbString(str) {
    // Accepts "r, g, b" or "rgb(r, g, b)" or "rgba(r, g, b, a)"
    const match = (str ?? "").match(/(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)/);
    if (!match) return null;
    const clamp = (n) => Math.min(255, Math.max(0, parseInt(n, 10)));
    return { r: clamp(match[1]), g: clamp(match[2]), b: clamp(match[3]) };
}

export function rgbToHex({ r, g, b }) {
    const toHex = (n) => n.toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function valueToRgbText(value) {
    const rgb = hexToRgb(value) ?? parseRgbString(value);
    if (!rgb) return "";
    return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
}

function toKebabCase(value) {
    return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

// Same key mapping useTheme.js uses to apply a saved theme app-wide
// (camelCase key -> --{prefix}-{kebab-case} custom property), but returns
// a plain style object instead of writing to document.documentElement.
// This lets a scoped container (like the theme editor's live preview)
// pick up in-progress, unsaved color edits immediately, without touching
// the real theme applied to the rest of the app.
export function themeValuesToCssVars({ colors, shadows }) {
    const style = {};
    Object.entries(colors ?? {}).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") return;
        style[`--color-${toKebabCase(key)}`] = value;
    });
    Object.entries(shadows ?? {}).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") return;
        style[`--shadow-${toKebabCase(key)}`] = value;
    });
    return style;
}

// ---------------------------------------------------------------
// Color math used by the Normal-mode shade generator and the
// Advanced-mode alpha slider / auto-shading.
// ---------------------------------------------------------------

const RGBA_PATTERN =
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([\d.]+)\s*)?\)$/i;

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

// Accepts "#rgb", "#rrggbb", "rgb(...)" and "rgba(...)".
// Returns { r, g, b, a } (a is 0..1) or null when the value isn't a
// complete, valid color (e.g. while the user is mid-typing).
export function parseColor(value) {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();

    const hex = hexToRgb(trimmed);
    if (hex) return { ...hex, a: 1 };

    const match = trimmed.match(RGBA_PATTERN);
    if (!match) return null;

    const [r, g, b] = [match[1], match[2], match[3]].map((n) => parseInt(n, 10));
    if ([r, g, b].some((n) => n > 255)) return null;

    const a = match[4] === undefined ? 1 : parseFloat(match[4]);
    if (Number.isNaN(a)) return null;

    return { r, g, b, a: clamp(a, 0, 1) };
}

// Plain hex when fully opaque (keeps built-in themes tidy), otherwise rgba().
export function formatColor({ r, g, b, a = 1 }) {
    const rr = clamp(Math.round(r), 0, 255);
    const gg = clamp(Math.round(g), 0, 255);
    const bb = clamp(Math.round(b), 0, 255);
    const aa = Math.round(clamp(a, 0, 1) * 100) / 100;
    if (aa >= 1) return rgbToHex({ r: rr, g: gg, b: bb });
    return `rgba(${rr}, ${gg}, ${bb}, ${aa})`;
}

export function rgbToHsl({ r, g, b }) {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const l = (max + min) / 2;
    const d = max - min;

    if (d === 0) return { h: 0, s: 0, l: l * 100 };

    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h;
    if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;

    return { h: h * 60, s: s * 100, l: l * 100 };
}

export function hslToRgb({ h, s, l }) {
    const sn = clamp(s, 0, 100) / 100;
    const ln = clamp(l, 0, 100) / 100;
    const hn = (((h % 360) + 360) % 360) / 360;

    if (sn === 0) {
        const v = ln * 255;
        return { r: v, g: v, b: v };
    }

    const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
    const p = 2 * ln - q;
    const channel = (t) => {
        let tt = t;
        if (tt < 0) tt += 1;
        if (tt > 1) tt -= 1;
        if (tt < 1 / 6) return p + (q - p) * 6 * tt;
        if (tt < 1 / 2) return q;
        if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
        return p;
    };

    return {
        r: channel(hn + 1 / 3) * 255,
        g: channel(hn) * 255,
        b: channel(hn - 1 / 3) * 255,
    };
}

// Shift lightness by `delta` percentage points, keeping hue/saturation/alpha.
export function adjustLightness(value, delta) {
    const c = parseColor(value);
    if (!c) return value;
    const hsl = rgbToHsl(c);
    return formatColor({ ...hslToRgb({ ...hsl, l: clamp(hsl.l + delta, 0, 100) }), a: c.a });
}

// t = 0 -> a, t = 1 -> b
export function mixColors(a, b, t) {
    const ca = parseColor(a);
    const cb = parseColor(b);
    if (!ca || !cb) return a;
    const mix = (x, y) => x + (y - x) * t;
    return formatColor({
        r: mix(ca.r, cb.r),
        g: mix(ca.g, cb.g),
        b: mix(ca.b, cb.b),
        a: mix(ca.a, cb.a),
    });
}

export function withAlpha(value, alpha) {
    const c = parseColor(value);
    if (!c) return value;
    return formatColor({ ...c, a: alpha });
}

export function getAlpha(value) {
    return parseColor(value)?.a ?? 1;
}

// WCAG relative luminance (0 = black, 1 = white).
export function relativeLuminance(value) {
    const c = parseColor(value);
    if (!c) return 0;
    const lin = (v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
}

export function isLightColor(value) {
    return relativeLuminance(value) > 0.4;
}
