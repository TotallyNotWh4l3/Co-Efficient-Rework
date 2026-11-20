// ===================================================
// ファイル名: alerts.js
// 作成日: 2026/10/22
// 概要: 天気ページのアラートしきい値（ルール定義と判定）
//       ルールの値は SI 系で保存し、入力・表示時に表示単位へ換算する。
//       判定は「今」と「今後48時間」の時間別データに対して行う。
// ===================================================

import { estimateWbgt } from "./meteo";

// dim: units.js の次元（null = 換算なし）
export const ALERT_METRICS = {
    temperature: { dim: "temp", unit: "°C", get: (h) => h.temperature },
    feelsLike: { dim: "temp", unit: "°C", get: (h) => h.feelsLike },
    wbgt: {
        dim: "temp",
        unit: "°C",
        get: (h) =>
            estimateWbgt({
                temp: h.temperature,
                humidity: h.humidity,
                radiationWm2: h.shortwaveRadiation,
                windMs: h.windSpeed,
            }),
    },
    windSpeed: { dim: "wind", unit: "m/s", get: (h) => h.windSpeed },
    windGust: { dim: "wind", unit: "m/s", get: (h) => h.windGust },
    precipMm: { dim: "precip", unit: "mm", get: (h) => h.precipitationSum },
    precipProb: { dim: null, unit: "%", get: (h) => h.precipitation },
    humidity: { dim: null, unit: "%", get: (h) => h.humidity },
    uv: { dim: null, unit: "", get: (h) => h.uvIndex },
    cape: { dim: null, unit: "J/kg", get: (h) => h.cape },
    visibility: {
        dim: "dist",
        unit: "km",
        get: (h) => (Number.isFinite(h.visibility) ? h.visibility / 1000 : null),
    },
    pressure: { dim: "pressure", unit: "hPa", get: (h) => h.pressureMsl },
};

// Which instrument tile lights up for which metric.
export const TILE_ALERT = {
    temperature: ["temperature"],
    feelsLike: ["feelsLike"],
    windSpeed: ["windSpeed"],
    windGust: ["windGust"],
    precipProb: ["precipProb"],
    humidity: ["humidity"],
    pressure: ["pressure"],
    visibility: ["visibility"],
    precip: ["precipMm", "precipProb"],
    uv: ["uv"],
    wbgt: ["wbgt"],
    cape: ["cape"],
};

export const DEFAULT_RULES = [
    { id: "r-temp-hi", metric: "temperature", op: ">=", value: 35, on: false },
    { id: "r-temp-lo", metric: "temperature", op: "<=", value: 0, on: false },
    { id: "r-gust", metric: "windGust", op: ">=", value: 15, on: false },
    { id: "r-pop", metric: "precipProb", op: ">=", value: 70, on: false },
    { id: "r-wbgt", metric: "wbgt", op: ">=", value: 28, on: false },
    { id: "r-uv", metric: "uv", op: ">=", value: 8, on: false },
];

const test = (rule, v) =>
    Number.isFinite(v) && (rule.op === ">=" ? v >= rule.value : v <= rule.value);

/**
 * @returns {Array<{rule, nowHit:boolean, hit:{time:string, value:number}|null}>}
 *   one entry per enabled rule that is hit now or within the next `horizon`
 *   hours; `hit` is the first (or, when already hit, the current) slot.
 */
export function evaluateAlerts(rules, hourly, nowIdx, horizon = 48) {
    const slots = hourly.slice(nowIdx, nowIdx + horizon);
    return rules
        .filter((r) => r.on && ALERT_METRICS[r.metric])
        .map((rule) => {
            const get = ALERT_METRICS[rule.metric].get;
            const i = slots.findIndex((h) => test(rule, get(h)));
            return {
                rule,
                nowHit: i === 0,
                hit: i === -1 ? null : { time: slots[i].time, value: get(slots[i]) },
            };
        })
        .filter((a) => a.hit);
}
