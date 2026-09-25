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
