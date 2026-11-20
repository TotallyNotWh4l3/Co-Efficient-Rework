// ===================================================
// ファイル名: units.js
// 作成日: 2026/10/22
// 概要: 天気ページの単位換算（気温・風速・気圧・降水量・距離・高度）
//       内部値は常に SI 系（°C, m/s, hPa, mm, km, m）。表示時だけ換算する。
// ===================================================

const DIMS = {
    temp: {
        c: { u: "°C", f: (v) => v, inv: (v) => v },
        f: { u: "°F", f: (v) => (v * 9) / 5 + 32, inv: (v) => ((v - 32) * 5) / 9 },
    },
    wind: {
        ms: { u: "m/s", f: (v) => v, inv: (v) => v },
        kmh: { u: "km/h", f: (v) => v * 3.6, inv: (v) => v / 3.6 },
        mph: { u: "mph", f: (v) => v * 2.236936, inv: (v) => v / 2.236936 },
        kn: { u: "kn", f: (v) => v * 1.943844, inv: (v) => v / 1.943844 },
    },
    pressure: {
        hpa: { u: "hPa", f: (v) => v, inv: (v) => v },
        inhg: { u: "inHg", f: (v) => v * 0.02953, inv: (v) => v / 0.02953 },
    },
    precip: {
        mm: { u: "mm", f: (v) => v, inv: (v) => v },
        in: { u: "in", f: (v) => v / 25.4, inv: (v) => v * 25.4 },
    },
    dist: {
        km: { u: "km", f: (v) => v, inv: (v) => v },
        mi: { u: "mi", f: (v) => v * 0.621371, inv: (v) => v / 0.621371 },
    },
    alt: {
        m: { u: "m", f: (v) => v, inv: (v) => v },
        ft: { u: "ft", f: (v) => v * 3.28084, inv: (v) => v / 3.28084 },
    },
};

const SYSTEMS = {
    metric: { temp: "c", wind: "ms", pressure: "hpa", precip: "mm", dist: "km", alt: "m" },
    imperial: { temp: "f", wind: "mph", pressure: "inhg", precip: "in", dist: "mi", alt: "ft" },
};

export const WIND_UNITS = Object.keys(DIMS.wind);
export const DEFAULT_UNITS = { system: "metric", wind: "ms" };

// Digits that look right per displayed unit.
const DIGITS = { inhg: 2, in: 2, mi: 1, km: 1, c: 0, f: 0 };

/**
 * @param {{system:"metric"|"imperial", wind:string}} prefs
 * @returns {Record<string, {u:string, f:(v:number)=>number, inv:(v:number)=>number, digits:number}>}
 *   keyed by dimension; every entry also has `d` (delta converter for temp).
 */
export function makeUnits({ system, wind }) {
    const pick = { ...SYSTEMS[system], wind };
    const out = {};
    Object.entries(pick).forEach(([dim, key]) => {
        out[dim] = { ...DIMS[dim][key], digits: DIGITS[key] ?? 1 };
    });
    // Temperature *differences* scale but have no offset.
    out.temp.d = system === "imperial" ? (v) => (v * 9) / 5 : (v) => v;
    return out;
}

// Null-safe conversion: keeps null/NaN as null so fmt() prints "--".
export const conv = (unit, v) => (Number.isFinite(v) ? unit.f(v) : null);
