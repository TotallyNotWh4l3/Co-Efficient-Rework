// ===================================================
// ファイル名: buildMetrics.jsx
// 作成日: 2026/10/27
// 概要: 天気データから「指標カタログ」を作る。タイル(TileModule)とカード(CardModule)は
//       どちらもここで作った指標を表示するだけで、指標ごとの計算を持たない。
//       旧 WeatherPage.jsx に直接書かれていた各タイルの値・サブ表示・ゲージ・スパークライン・
//       詳細チャートの定義をここへ集約したもの（表示内容は従来どおり）。
//       新しい指標は METRIC_DEFS と、ここの SOURCES / NOW / SUB / DETAIL に足せばよい。
// ===================================================

import TendencyIcon from "../components/TendencyIcon";
import { TILE_ALERT } from "../utils/alerts";
import { conv } from "../utils/units";
import {
    beaufort,
    classifyCape,
    classifyUv,
    classifyWbgt,
    cloudBaseMeters,
    dewPoint,
    estimateWbgt,
    fmt,
    fmtSigned,
    frac,
    pressureTendency,
    toCardinal,
    vaporPressureDeficit,
    wetBulb,
} from "../utils/meteo";
import { METRIC_DEFS, METRIC_IDS } from "./metricDefs";

const finite = (v) => (Number.isFinite(v) ? v : null);

/**
 * @param {object} p
 * @param {object} p.T        — lang.weatherPage
 * @param {object} p.U        — makeUnits(...)
 * @param {object} p.cur      — weather.current
 * @param {object[]} p.hourly
 * @param {object[]} p.daily
 * @param {number} p.nowIdx   — index of "now" in `hourly`
 * @param {Set<string>} p.nowHits — alert-rule metrics that are hit right now
 * @param {object[]} p.sparkWin — 25 h of hourly slots around now (tile sparklines)
 * @param {number} p.sparkNow   — index of now within sparkWin
 * @param {object[]} p.win      — hourly slots of the selected range (detail charts)
 * @param {object[]} p.fullWin  — longest range (card charts; `viewCount` of it is in view)
 * @param {number} p.viewCount
 * @param {number} p.chartNow   — index of now within win / fullWin
 * @returns {{metrics: Record<string, object>, chart: object}}
 */
export default function buildMetrics({
    T,
    U,
    cur,
    hourly,
    daily,
    nowIdx,
    nowHits,
    sparkWin,
    sparkNow,
    win,
    fullWin,
    viewCount,
    chartNow,
}) {
    const nowHour = hourly[nowIdx] ?? {};
    const today = daily[0] ?? {};
    const tc = (v) => conv(U.temp, v);

    // ---------- derived "now" values (SI) ----------
    const td = dewPoint(cur.temperature, cur.humidity);
    const spread = td === null ? null : cur.temperature - td;
    const vpd = vaporPressureDeficit(cur.temperature, cur.humidity);
    const tw = wetBulb(cur.temperature, cur.humidity);
    const cloudBase = cur.cloudCover >= 25 ? cloudBaseMeters(cur.temperature, td) : null;
    const tendency = pressureTendency(hourly, nowIdx);
    const wbgt = estimateWbgt({
        temp: cur.temperature,
        humidity: cur.humidity,
        radiationWm2: nowHour.shortwaveRadiation,
        windMs: cur.windSpeed,
    });
    const wbgtClass = classifyWbgt(wbgt);
    const uvClass = classifyUv(nowHour.uvIndex);
    const capeClass = classifyCape(nowHour.cape);
    const visKm = Number.isFinite(nowHour.visibility) ? nowHour.visibility / 1000 : null;
    const force = beaufort(cur.windSpeed);
    const gustFactor = cur.windSpeed > 0.5 ? cur.windGust / cur.windSpeed : null;
    const next24 = hourly.slice(nowIdx, nowIdx + 24);
    const probPeak = next24.reduce(
        (m, h) => (Number.isFinite(h.precipitation) ? Math.max(m, h.precipitation) : m),
        0,
    );

    // ---------- where each metric's hourly values come from ----------
    // get  : hourly slot -> SI value     dim: units.js dimension (none = no conversion)
    const SOURCES = {
        temperature: { get: (h) => h.temperature, dim: "temp" },
        feelsLike: { get: (h) => h.feelsLike, dim: "temp" },
        dewPoint: { get: (h) => h.dewPoint, dim: "temp" },
        wetBulb: { get: (h) => wetBulb(h.temperature, h.humidity), dim: "temp" },
        wbgt: {
            get: (h) =>
                estimateWbgt({
                    temp: h.temperature,
                    humidity: h.humidity,
                    radiationWm2: h.shortwaveRadiation,
                    windMs: h.windSpeed,
                }),
            dim: "temp",
        },
        humidity: { get: (h) => h.humidity },
        cloud: { get: (h) => h.cloudCover },
        precip: { get: (h) => h.precipitationSum, dim: "precip" },
        precipProb: { get: (h) => h.precipitation },
        pressure: { get: (h) => h.pressureMsl, dim: "pressure" },
        windSpeed: { get: (h) => h.windSpeed, dim: "wind" },
        windGust: { get: (h) => h.windGust, dim: "wind" },
        uv: { get: (h) => h.uvIndex },
        cape: { get: (h) => h.cape },
        visibility: {
            get: (h) => (Number.isFinite(h.visibility) ? h.visibility / 1000 : null),
            dim: "dist",
        },
        freezing: { get: (h) => h.freezingLevel, dim: "alt" },
    };

    const unitOf = (id) => {
        const dim = SOURCES[id].dim;
        return dim ? U[dim] : null;
    };
    // hourly slots -> numbers in display units (null = gap)
    const seriesOf = (id, slots) => {
        const { get } = SOURCES[id];
        const u = unitOf(id);
        return slots.map((h) => {
            const v = get(h);
            return Number.isFinite(v) ? (u ? u.f(v) : v) : null;
        });
    };
    // sparklines are normalised, so they stay in SI
    const sparkOf = (id) => sparkWin.map((h) => finite(SOURCES[id].get(h)));

    // ---------- axes that never shrink below a sensible range ----------
    const maxOf = (id) => win.reduce((m, h) => Math.max(m, seriesOf(id, [h])[0] ?? 0), 0);
    const uvDomain = [0, Math.max(10, Math.ceil(maxOf("uv")))];
    const precipBase = U.precip.f(5);
    const precipStep = precipBase / 5;
    const precipDomain = [
        0,
        Math.max(precipBase, Math.ceil(maxOf("precip") / precipStep) * precipStep),
    ];
    const domains = { uv: uvDomain, precip: precipDomain };

    // ---------- now: SI value, digits, unit label, subtitle, tone ----------
    const NOW = {
        temperature: {
            raw: cur.temperature,
            digits: 0,
            sub: `${T.hero.today} ${fmt(tc(today.high))}° / ${fmt(tc(today.low))}°`,
        },
        feelsLike: {
            raw: cur.feelsLike,
            digits: 0,
            sub: `Δ ${fmtSigned(U.temp.d(cur.feelsLike - cur.temperature))}°`,
        },
        dewPoint: {
            raw: td,
            digits: 1,
            sub: `${T.tiles.spread} ${fmt(spread === null ? null : U.temp.d(spread), 1)}°`,
        },
        wetBulb: {
            raw: tw,
            digits: 1,
            sub: `T − Tw ${fmt(tw === null ? null : U.temp.d(cur.temperature - tw), 1)}°`,
        },
        wbgt: {
            raw: wbgt,
            digits: 1,
            tone: wbgtClass?.tone,
            sub: wbgtClass ? T.wbgtLevels[wbgtClass.key] : "—",
        },
        humidity: { raw: cur.humidity, digits: 0, unit: "%", sub: `VPD ${fmt(vpd, 2)} kPa` },
        cloud: {
            raw: cur.cloudCover,
            digits: 0,
            unit: "%",
            sub:
                cloudBase === null
                    ? "—"
                    : `${T.tiles.base} ≈ ${fmt(conv(U.alt, cloudBase))} ${U.alt.u}`,
        },
        precip: {
            raw: cur.precipitation,
            digits: U.precip.digits,
            sub: `${T.tiles.prob} ${fmt(nowHour.precipitation)}%`,
        },
        precipProb: {
            raw: nowHour.precipitation,
            digits: 0,
            unit: "%",
            sub: `${T.sun.max} ${fmt(probPeak)}% · 24 h`,
        },
        pressure: {
            raw: cur.pressureMsl,
            digits: U.pressure.digits,
            sub: tendency ? (
                <span className="wxp-tile__trend">
                    <TendencyIcon tendency={tendency} />
                    {T.tendency[tendency.key]}{" "}
                    {fmtSigned(U.pressure.f(tendency.delta), U.pressure.digits)} {U.pressure.u}/3h
                </span>
            ) : (
                `stn ${fmt(conv(U.pressure, cur.surfacePressure), U.pressure.digits)}`
            ),
        },
        windSpeed: {
            raw: cur.windSpeed,
            digits: 1,
            sub:
                force === null
                    ? "—"
                    : `${toCardinal(cur.windDirection)} · ${T.wind.beaufort} ${force}`,
        },
        windGust: {
            raw: cur.windGust,
            digits: 1,
            sub: gustFactor === null ? "—" : `${T.wind.gustFactor} ×${fmt(gustFactor, 2)}`,
        },
        uv: {
            raw: nowHour.uvIndex,
            digits: 1,
            unit: "",
            tone: uvClass?.tone,
            sub: uvClass ? `${T.uvLevels[uvClass.key]} · max ${fmt(today.uvIndex, 1)}` : "—",
        },
        cape: {
            raw: nowHour.cape,
            digits: 0,
            unit: "J/kg",
            tone: capeClass?.tone,
            sub: capeClass ? T.capeLevels[capeClass.key] : "—",
        },
        visibility: { raw: visKm, digits: 1, sub: T.tiles.hourlyModel },
        freezing: { raw: nowHour.freezingLevel, digits: 0, sub: "0 °C isotherm" },
    };

    // ---------- the click-through detail chart (TileDetail) ----------
    const times = win.map((h) => h.time);
    const sr = (key, label, color, id, extra = {}, over = {}) => ({
        key,
        label,
        color,
        values: seriesOf(id, win),
        unit: over.unit ?? unitOf(id)?.u ?? NOW[id].unit ?? "",
        digits: over.digits ?? NOW[id].digits,
        ...extra,
    });
    const AX = { area: true, extrema: true };
    const DEF = METRIC_DEFS;
    const DETAIL = {
        temperature: () => ({
            series: [
                sr("t", T.metrics.temperature, DEF.temperature.color, "temperature", AX),
                sr("f", "Feels", DEF.feelsLike.color, "feelsLike", { dashed: true }),
            ],
        }),
        feelsLike: () => ({
            series: [
                sr("f", T.tiles.feelsLike, DEF.temperature.color, "feelsLike", AX),
                sr("t", "T", DEF.feelsLike.color, "temperature", { dashed: true }, { digits: 0 }),
            ],
        }),
        dewPoint: () => ({
            series: [
                sr("d", "Td", DEF.dewPoint.color, "dewPoint", AX),
                sr("t", "T", DEF.temperature.color, "temperature", { dashed: true }, { digits: 0 }),
            ],
        }),
        humidity: () => ({
            series: [sr("rh", "RH", DEF.humidity.color, "humidity", AX)],
            domain: [0, 100],
        }),
        wetBulb: () => ({ series: [sr("wb", T.tiles.wetBulb, DEF.wetBulb.color, "wetBulb", AX)] }),
        pressure: () => ({ series: [sr("p", "MSL", DEF.pressure.color, "pressure", AX)] }),
        cloud: () => ({
            series: [
                sr("cc", T.tiles.cloud, DEF.cloud.color, "cloud", { kind: "bar", opacity: 0.3 }),
            ],
            domain: [0, 100],
        }),
        visibility: () => ({
            series: [
                sr("v", T.tiles.visibility, DEF.visibility.color, "visibility", {
                    area: true,
                    nonNegative: true,
                }),
            ],
        }),
        precip: () => ({
            series: [
                sr("mm", T.tiles.precip, DEF.precip.color, "precip", {
                    kind: "bar",
                    nonNegative: true,
                }),
                sr("pp", T.tiles.prob, DEF.precipProb.color, "precipProb", {
                    axis: "right",
                    dashed: true,
                    nonNegative: true,
                }),
            ],
            domain: precipDomain,
            rightDomain: [0, 100],
        }),
        precipProb: () => ({
            series: [
                sr("pp", T.tiles.prob, DEF.precipProb.accent, "precipProb", {
                    ...AX,
                    nonNegative: true,
                }),
            ],
            domain: [0, 100],
        }),
        uv: () => ({
            series: [sr("uv", "UV", DEF.uv.color, "uv", { ...AX, nonNegative: true })],
            domain: uvDomain,
        }),
        wbgt: () => ({ series: [sr("wbgt", "WBGT", DEF.wbgt.color, "wbgt", AX)] }),
        cape: () => ({
            series: [sr("cape", "CAPE", DEF.cape.color, "cape", { ...AX, nonNegative: true })],
        }),
        freezing: () => ({
            series: [sr("fl", T.tiles.freezing, DEF.freezing.color, "freezing", AX)],
        }),
        windSpeed: () => ({
            series: [
                sr("w", "Wind", DEF.windSpeed.color, "windSpeed", { ...AX, nonNegative: true }),
                sr("g", "Gust", DEF.windGust.color, "windGust", {
                    dashed: true,
                    nonNegative: true,
                }),
            ],
        }),
        windGust: () => ({
            series: [
                sr("g", "Gust", DEF.windGust.color, "windGust", { ...AX, nonNegative: true }),
                sr("w", "Wind", DEF.windSpeed.color, "windSpeed", {
                    dashed: true,
                    nonNegative: true,
                }),
            ],
        }),
    };

    // ---------- assemble ----------
    const metrics = {};
    for (const id of METRIC_IDS) {
        const def = METRIC_DEFS[id];
        const now = NOW[id];
        const u = unitOf(id);
        const unit = u?.u ?? now.unit ?? "";
        const value = u ? conv(u, now.raw) : finite(now.raw);
        const label = T.metrics[id];
        const hint = T.hints[id];

        metrics[id] = {
            id,
            label,
            short: def.short,
            hint,
            axis: def.axis,
            color: def.color,
            accent: def.accent ?? def.color,
            unit,
            digits: now.digits,
            value,
            sub: now.sub,
            tone: now.tone,
            alert: TILE_ALERT[id]?.some((m) => nowHits.has(m)) ?? false,
            gauge: frac(now.raw, def.range[0], def.range[1]),
            spark: sparkOf(id),
            sparkNow,
            // card chart: every point of the longest range, in display units
            values: seriesOf(id, fullWin),
            domain: domains[id] ?? def.fixedDomain,
            dashed: def.dashed ?? false,
            extrema: def.extrema ?? false,
            nonNegative: def.nonNegative ?? false,
            barOpacity: def.barOpacity,
            detail: {
                title: label,
                value,
                unit,
                hint,
                times,
                nowIndex: chartNow,
                nowLabel: T.now,
                ...DETAIL[id](),
            },
        };
    }

    return {
        metrics,
        chart: {
            times: fullWin.map((h) => h.time),
            viewCount,
            nowIndex: chartNow,
            nowLabel: T.now,
            labels: T.detail.chart,
        },
    };
}
