// ===================================================
// ファイル名: meteo.js
// 作成日: 2026/10/21
// 概要: 天気ページ用の気象計算ユーティリティ
//       （露点・湿球温度・VPD・WBGT推定・太陽位置・ビューフォート風力など）
//       すべて純粋関数。値が欠けている場合は null を返す。
// ===================================================

const isNum = (v) => typeof v === "number" && Number.isFinite(v);

export function fmt(value, digits = 0, fallback = "--") {
    return isNum(value) ? value.toFixed(digits) : fallback;
}

export function fmtSigned(value, digits = 0, fallback = "--") {
    if (!isNum(value)) return fallback;
    const s = value.toFixed(digits);
    return value > 0 ? `+${s}` : s;
}

// "2026-10-21T05:41" (location-local, no zone) -> pseudo-UTC ms.
// Only ever used for differences between two such strings.
export const localMs = (s) => (s ? Date.parse(`${s}Z`) : NaN);

export const hhmm = (s) => (s ? (s.split("T")[1]?.slice(0, 5) ?? "--:--") : "--:--");

export function formatDuration(seconds) {
    if (!isNum(seconds)) return "--";
    const m = Math.round(seconds / 60);
    return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
}

// ---------- Moisture ----------

// Dew point via the Magnus formula (Sonntag 1990 coefficients), °C.
export function dewPoint(tempC, rh) {
    if (!isNum(tempC) || !isNum(rh)) return null;
    const a = 17.62;
    const b = 243.12;
    const gamma = Math.log(Math.max(rh, 1) / 100) + (a * tempC) / (b + tempC);
    return (b * gamma) / (a - gamma);
}

// Vapor pressure deficit, kPa (Tetens saturation vapor pressure).
export function vaporPressureDeficit(tempC, rh) {
    if (!isNum(tempC) || !isNum(rh)) return null;
    const es = 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3));
    return es * (1 - rh / 100);
}

// Wet-bulb temperature, Stull (2011). Valid for RH 5–99 %, T −20…50 °C.
export function wetBulb(tempC, rh) {
    if (!isNum(tempC) || !isNum(rh)) return null;
    const T = tempC;
    const R = rh;
    return (
        T * Math.atan(0.151977 * Math.sqrt(R + 8.313659)) +
        Math.atan(T + R) -
        Math.atan(R - 1.676331) +
        0.00391838 * Math.pow(R, 1.5) * Math.atan(0.023101 * R) -
        4.686035
    );
}

// Rule-of-thumb cloud base height above ground, metres: 125 m per °C of
// dew-point spread. Only meaningful when clouds are actually present.
export function cloudBaseMeters(tempC, dewC) {
    if (!isNum(tempC) || !isNum(dewC)) return null;
    return Math.max(0, 125 * (tempC - dewC));
}

// ---------- Heat stress ----------

// Outdoor WBGT estimate (Ono & Tonouchi 2014 regression, as used in
// Japanese heat-stroke guidance). radiationWm2 = shortwave radiation.
export function estimateWbgt({ temp, humidity, radiationWm2, windMs }) {
    if (![temp, humidity, radiationWm2, windMs].every(isNum)) return null;
    const sr = Math.max(0, radiationWm2) / 1000; // kW/m²
    return (
        0.735 * temp +
        0.0374 * humidity +
        0.00292 * temp * humidity +
        7.619 * sr -
        4.557 * sr * sr -
        0.0572 * windMs -
        4.064
    );
}

// Japanese Ministry of the Environment WBGT bands.
export function classifyWbgt(v) {
    if (!isNum(v)) return null;
    if (v >= 31) return { key: "danger", tone: "bad" };
    if (v >= 28) return { key: "severe", tone: "bad" };
    if (v >= 25) return { key: "warning", tone: "warn" };
    if (v >= 21) return { key: "caution", tone: "warn" };
    return { key: "safe", tone: "ok" };
}

export function classifyUv(v) {
    if (!isNum(v)) return null;
    if (v >= 11) return { key: "extreme", tone: "bad" };
    if (v >= 8) return { key: "veryHigh", tone: "bad" };
    if (v >= 6) return { key: "high", tone: "warn" };
    if (v >= 3) return { key: "moderate", tone: "warn" };
    return { key: "low", tone: "ok" };
}

// CAPE in J/kg — rough convective-potential bands.
export function classifyCape(v) {
    if (!isNum(v)) return null;
    if (v >= 4000) return { key: "extreme", tone: "bad" };
    if (v >= 2500) return { key: "strong", tone: "bad" };
    if (v >= 1000) return { key: "moderate", tone: "warn" };
    if (v >= 300) return { key: "weak", tone: "warn" };
    return { key: "negligible", tone: "ok" };
}

// ---------- Wind ----------

const CARDINALS_16 = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
];

export function toCardinal(deg) {
    if (!isNum(deg)) return "--";
    return CARDINALS_16[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16];
}

// Upper bounds (m/s) of Beaufort forces 0..11; anything above is force 12.
const BEAUFORT_LIMITS = [0.3, 1.6, 3.4, 5.5, 8.0, 10.8, 13.9, 17.2, 20.8, 24.5, 28.5, 32.7];

export function beaufort(ms) {
    if (!isNum(ms)) return null;
    const i = BEAUFORT_LIMITS.findIndex((limit) => ms < limit);
    return i === -1 ? 12 : i;
}

// ---------- Pressure ----------

// Index of the hourly slot that contains `currentTime` (both location-local).
export function findNowIndex(hourly, currentTime) {
    if (!currentTime) return 0;
    const slot = `${currentTime.slice(0, 13)}:00`;
    const i = hourly.findIndex((h) => h.time === slot);
    return i === -1 ? 0 : i;
}

// Forecast 3-hour tendency: now vs now+3h.
export function pressureTendency(hourly, nowIdx) {
    const a = hourly[nowIdx]?.pressureMsl;
    const b = hourly[nowIdx + 3]?.pressureMsl;
    if (!isNum(a) || !isNum(b)) return null;
    const delta = b - a;
    let key = "steady";
    if (delta >= 3) key = "risingFast";
    else if (delta >= 1) key = "rising";
    else if (delta <= -3) key = "fallingFast";
    else if (delta <= -1) key = "falling";
    return { delta, key };
}

// ---------- Sun ----------

/**
 * Solar altitude/azimuth for an absolute instant (low-precision NOAA-style
 * algorithm, ~0.05° — plenty for a dashboard). No atmospheric refraction.
 * @returns {{ altitude: number, azimuth: number, declination: number }}
 *   degrees; azimuth is clockwise from north.
 */
export function solarPosition(date, latDeg, lonDeg) {
    const rad = Math.PI / 180;
    const n = date.getTime() / 86400000 + 2440587.5 - 2451545.0; // days since J2000

    const meanLon = (((280.46 + 0.9856474 * n) % 360) + 360) % 360;
    const g = ((357.528 + 0.9856003 * n) % 360) * rad;
    const lambda = (meanLon + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * rad;
    const eps = (23.439 - 0.0000004 * n) * rad;

    const ra = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda));
    const dec = Math.asin(Math.sin(eps) * Math.sin(lambda));

    const gmstHours = (((18.697374558 + 24.06570982441908 * n) % 24) + 24) % 24;
    const hourAngle = (gmstHours * 15 + lonDeg) * rad - ra;
    const lat = latDeg * rad;

    const altitude = Math.asin(
        Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(hourAngle),
    );
    const azimuth = Math.atan2(
        -Math.sin(hourAngle),
        Math.tan(dec) * Math.cos(lat) - Math.sin(lat) * Math.cos(hourAngle),
    );

    return {
        altitude: altitude / rad,
        azimuth: (((azimuth / rad) % 360) + 360) % 360,
        declination: dec / rad,
    };
}

// Solar noon altitude for a given declination: 90° − |lat − dec|.
export function noonAltitude(latDeg, decDeg) {
    return 90 - Math.abs(latDeg - decDeg);
}

export function formatCoord(value, positive, negative) {
    if (!isNum(value)) return "--";
    return `${Math.abs(value).toFixed(4)}°${value >= 0 ? positive : negative}`;
}

// ---------- Moon ----------

const MOON_KEYS = [
    "new",
    "waxingCrescent",
    "firstQuarter",
    "waxingGibbous",
    "full",
    "waningGibbous",
    "lastQuarter",
    "waningCrescent",
];

export const SYNODIC_DAYS = 29.530588;

// Open-Meteo moon_phase: 0 = new, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter.
export function moonPhaseKey(phase) {
    return isNum(phase) ? MOON_KEYS[Math.round(phase * 8) % 8] : null;
}

export const moonIllumination = (phase) =>
    isNum(phase) ? (1 - Math.cos(2 * Math.PI * phase)) / 2 : null;

/**
 * The moon interval that matters right now, built from the daily moonrise /
 * moonset list: the one containing `now` (up: true), else the next one to come
 * (up: false). Times are location-local ISO strings, like the daily sunrise.
 * When the moon rose before the first forecast day, the rise is unknown
 * (riseKnown: false) and only estimated so the arc can still be drawn.
 */
export function moonWindow(daily, now) {
    const t = localMs(now);
    if (!isNum(t)) return null;

    const rises = [];
    const sets = [];
    daily.forEach((d) => {
        const r = localMs(d.moonrise);
        const s = localMs(d.moonset);
        if (isNum(r)) rises.push(r);
        if (isNum(s)) sets.push(s);
    });
    rises.sort((a, b) => a - b);
    sets.sort((a, b) => a - b);

    const spans = [];
    if (sets.length && (!rises.length || sets[0] < rises[0])) {
        spans.push({ rise: sets[0] - 12 * 3600000, set: sets[0], riseKnown: false });
    }
    rises.forEach((r) => {
        const s = sets.find((x) => x > r);
        if (s !== undefined) spans.push({ rise: r, set: s, riseKnown: true });
    });

    const inside = spans.find((x) => t >= x.rise && t <= x.set);
    const span = inside ?? spans.find((x) => x.rise > t);
    if (!span) return null;

    const iso = (ms) => new Date(ms).toISOString().slice(0, 16);
    return {
        up: Boolean(inside),
        riseKnown: span.riseKnown,
        rise: iso(span.rise),
        set: iso(span.set),
    };
}

/**
 * Approximate lunar position (low-precision series, good to ~0.5°).
 * Altitude includes topocentric parallax; azimuth is clockwise from north.
 */
export function moonPosition(date, latDeg, lonDeg) {
    const rad = Math.PI / 180;
    const d = date.getTime() / 86400000 + 2440587.5 - 2451545.0; // days since J2000

    const L = rad * (218.316 + 13.176396 * d);
    const M = rad * (134.963 + 13.064993 * d);
    const F = rad * (93.272 + 13.22935 * d);
    const lon = L + rad * 6.289 * Math.sin(M);
    const lat = rad * 5.128 * Math.sin(F);
    const distKm = 385001 - 20905 * Math.cos(M);

    const eps = rad * 23.4397;
    const ra = Math.atan2(
        Math.sin(lon) * Math.cos(eps) - Math.tan(lat) * Math.sin(eps),
        Math.cos(lon),
    );
    const dec = Math.asin(
        Math.sin(lat) * Math.cos(eps) + Math.cos(lat) * Math.sin(eps) * Math.sin(lon),
    );

    const siderealTime = rad * (280.16 + 360.9856235 * d) + rad * lonDeg;
    const H = siderealTime - ra;
    const phi = latDeg * rad;

    let altitude = Math.asin(
        Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H),
    );
    // topocentric parallax (up to ~1° near the horizon)
    altitude -= Math.asin(6378.14 / distKm) * Math.cos(altitude);

    const azimuth = Math.atan2(
        Math.sin(H),
        Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi),
    );

    return {
        altitude: altitude / rad,
        azimuth: (((azimuth / rad + 180) % 360) + 360) % 360,
    };
}
