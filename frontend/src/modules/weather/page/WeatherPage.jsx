// ===================================================
// ファイル名: WeatherPage.jsx
// 作成日: 2026/10/21
// 概要: 独立した天気ページ（サイドバー「天気」セクション）
//       計器タイル・風/太陽(+月)・時系列チャート・7日間表・時間別生データ表を
//       ページ全体のスクロール無しで一画面に収めて表示する。
//       データは既存の useWeather / GET /weather をそのまま利用する。
// ===================================================

import { useEffect, useState } from "react";
import { RefreshCw, MapPin, ArrowUp, ArrowDown, ArrowRight, Bell } from "lucide-react";

import useWeather from "../useWeather";
import { useLocation } from "../../locations/useLocation";
import { useSettings } from "../../settings/useSettings";
import { useLanguage } from "../../settings/useLanguage";

import TimeSeries from "../components/TimeSeries";
import Compass from "../components/Compass";
import SunArc from "../components/SunArc";
import Sparkline from "../components/Sparkline";
import TileDetail from "../components/TileDetail";
import AlertPanel from "../components/AlertPanel";
import MoonPhase from "../components/MoonPhase";
import CountUp from "../components/CountUp";
import usePersistentState from "../utils/usePersistentState";
import { makeUnits, conv, WIND_UNITS, DEFAULT_UNITS } from "../utils/units";
import { ALERT_METRICS, TILE_ALERT, DEFAULT_RULES, evaluateAlerts } from "../utils/alerts";
import {
    fmt,
    fmtSigned,
    hhmm,
    localMs,
    formatDuration,
    formatCoord,
    dewPoint,
    vaporPressureDeficit,
    wetBulb,
    cloudBaseMeters,
    estimateWbgt,
    classifyWbgt,
    classifyUv,
    classifyCape,
    toCardinal,
    beaufort,
    findNowIndex,
    pressureTendency,
    solarPosition,
    noonAltitude,
    moonWindow,
    moonPosition,
    moonPhaseKey,
    moonIllumination,
    solarCrossings,
    SYNODIC_DAYS,
} from "../utils/meteo";
import "./weather-page.css";

const RANGES = [
    { id: "h24", hours: 24 },
    { id: "h48", hours: 48 },
    { id: "h72", hours: 72 },
    { id: "d7", hours: 168 },
];

// How many hours of already-elapsed context to show before "now".
const LOOKBACK_HOURS = 3;

const C = {
    temp: "#fb923c",
    feels: "var(--color-accent)",
    dew: "#38bdf8",
    rh: "#38bdf8",
    cloud: "var(--color-text-muted)",
    pressure: "#a78bfa",
    wind: "#34d399",
    gust: "#fbbf24",
    precip: "#60a5fa",
    prob: "var(--color-text-secondary)",
    uv: "#f472b6",
    cape: "#f87171",
};

// Temperature -> hue (cold blue ... hot red). Drives the hero glow and table tints.
const HEAT_STOPS = [
    [-10, 220],
    [5, 200],
    [15, 160],
    [22, 50],
    [30, 22],
    [38, 2],
];

function heatHue(t) {
    if (!Number.isFinite(t)) return 215;
    if (t <= HEAT_STOPS[0][0]) return HEAT_STOPS[0][1];
    for (let i = 1; i < HEAT_STOPS.length; i++) {
        const [t1, h1] = HEAT_STOPS[i];
        const [t0, h0] = HEAT_STOPS[i - 1];
        if (t <= t1) return h0 + ((t - t0) / (t1 - t0)) * (h1 - h0);
    }
    return HEAT_STOPS[HEAT_STOPS.length - 1][1];
}

// value -> 0..1 (null when unknown)
const frac = (v, lo, hi) =>
    Number.isFinite(v) ? Math.min(1, Math.max(0, (v - lo) / (hi - lo))) : null;

// Inset shadow layers over the cell's own background, so the "today" row stays visible.
const glow = (hue, f) =>
    f > 0.02
        ? { boxShadow: `inset 0 0 0 100vmax hsl(${hue} 85% 55% / ${(f * 0.35).toFixed(2)})` }
        : undefined;
const tint = (v, lo, hi, hue) => (Number.isFinite(v) ? glow(hue, frac(v, lo, hi)) : undefined);
// " (+1d)" when an event falls on another date than the reference one.
const dayShift = (iso, ref) => {
    if (!iso || !ref) return "";
    const d = Math.round((Date.parse(iso.slice(0, 10)) - Date.parse(ref.slice(0, 10))) / 86400000);
    return d === 0 ? "" : ` (${d > 0 ? "+" : ""}${d}d)`;
};

const heatCell = (v) => (Number.isFinite(v) ? glow(heatHue(v), 0.7) : undefined);

function Tile({
    id,
    alert,
    onOpen,
    label,
    value,
    unit,
    sub,
    tone,
    hint,
    accent,
    gauge = null,
    spark,
    sparkNow,
    children,
}) {
    return (
        <div
            className={`wxp-tile${tone ? ` wxp-tile--${tone}` : ""}${alert ? " wxp-tile--alert" : ""}`}
            style={tone || !accent ? undefined : { "--accent": accent }}
            title={hint}
            role="button"
            tabIndex={0}
            onClick={() => onOpen?.(id)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen?.(id)}
        >
            {alert && <Bell className="wxp-tile__bell" size={12} />}
            <div className="wxp-tile__label">{label}</div>
            <div className="wxp-tile__value">
                {value}
                {unit && <span className="wxp-tile__unit">{unit}</span>}
            </div>
            {sub && <div className="wxp-tile__sub">{sub}</div>}
            {spark && (
                <Sparkline className="wxp-tile__spark" values={spark} nowIndex={sparkNow} area />
            )}
            {gauge !== null && (
                <div className="wxp-gauge">
                    <i style={{ "--fill": gauge }} />
                </div>
            )}
            {children}
        </div>
    );
}

function Card({ title, children, className = "" }) {
    return (
        <section className={`wxp-card ${className}`}>
            <h3 className="wxp-card__title">{title}</h3>
            {children}
        </section>
    );
}

function TendencyIcon({ tendency }) {
    if (!tendency) return null;
    const size = 12;
    if (tendency.key === "rising" || tendency.key === "risingFast") return <ArrowUp size={size} />;
    if (tendency.key === "falling" || tendency.key === "fallingFast")
        return <ArrowDown size={size} />;
    return <ArrowRight size={size} />;
}

export default function WeatherPage() {
    const lang = useLanguage();
    const T = lang.weatherPage;
    const { locationOptions } = useLocation();
    const { settings, updatePreference } = useSettings();

    const [locationId, setLocationId] = useState(null);
    const [rangeId, setRangeId] = useState("h48");
    // Saved per user in settings.preferences (autosaved by useSettings).
    const unitPrefs = settings?.preferences?.weatherUnits ?? DEFAULT_UNITS;
    const setUnitPrefs = (value) => updatePreference("weatherUnits", value);
    const [rules, setRules] = usePersistentState("wxp-alert-rules", DEFAULT_RULES);
    const [expanded, setExpanded] = useState(null);
    const [alertOpen, setAlertOpen] = useState(false);
    const U = makeUnits(unitPrefs);

    // Resolve a starting location once the list is known. Until then the
    // backend falls back to the user's default location on its own.
    useEffect(() => {
        if (locationId || locationOptions.length === 0) return;
        setLocationId(settings?.preferences?.locationId ?? locationOptions[0].id);
    }, [locationId, locationOptions, settings?.preferences?.locationId]);

    const { weather, loading, error, refresh } = useWeather(locationId ?? undefined);

    const renderHeader = (alertCount = 0) => (
        <header className="wxp-header">
            <div className="wxp-header__title">
                <h2>{T.title}</h2>
                <span>{T.source}</span>
            </div>

            <div className="wxp-header__controls">
                <label className="wxp-select">
                    <MapPin size={14} />
                    <select
                        value={locationId ?? weather?.location?.id ?? ""}
                        onChange={(e) => setLocationId(e.target.value)}
                        aria-label={T.location}
                    >
                        {locationOptions.map((o) => (
                            <option key={o.id} value={o.id}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                </label>

                <div className="wxp-segmented" role="group">
                    {RANGES.map((r) => (
                        <button
                            key={r.id}
                            className={rangeId === r.id ? "is-active" : ""}
                            onClick={() => setRangeId(r.id)}
                        >
                            {T.ranges[r.id]}
                        </button>
                    ))}
                </div>

                <div className="wxp-segmented" role="group" aria-label={T.units.title}>
                    {["metric", "imperial"].map((sys) => (
                        <button
                            key={sys}
                            className={unitPrefs.system === sys ? "is-active" : ""}
                            onClick={() =>
                                setUnitPrefs({ system: sys, wind: sys === "metric" ? "ms" : "mph" })
                            }
                        >
                            {T.units[sys]}
                        </button>
                    ))}
                </div>

                <label className="wxp-select">
                    <select
                        value={unitPrefs.wind}
                        onChange={(e) => setUnitPrefs({ ...unitPrefs, wind: e.target.value })}
                        aria-label={T.units.wind}
                    >
                        {WIND_UNITS.map((w) => (
                            <option key={w} value={w}>
                                {T.units.windNames[w]}
                            </option>
                        ))}
                    </select>
                </label>

                <button
                    className="wxp-icon-btn wxp-bell"
                    onClick={() => setAlertOpen(true)}
                    title={T.alerts.title}
                    aria-label={T.alerts.title}
                >
                    <Bell size={14} />
                    {alertCount > 0 && <b className="wxp-bell__badge">{alertCount}</b>}
                </button>

                <button
                    className="wxp-icon-btn"
                    onClick={refresh}
                    title={T.refresh}
                    aria-label={T.refresh}
                >
                    <RefreshCw size={14} />
                </button>
            </div>
        </header>
    );

    if (!weather || !weather.current) {
        return (
            <div className="wxp">
                {renderHeader()}
                <div className="wxp-state">
                    {loading && !error ? (
                        <span>{T.loading}</span>
                    ) : (
                        <>
                            <span>{error ? T.error : T.noData}</span>
                            <button className="wxp-retry" onClick={refresh}>
                                {T.retry}
                            </button>
                        </>
                    )}
                </div>
            </div>
        );
    }

    // ---------- derived data ----------
    const { current: cur, hourly = [], daily = [], location: loc = {} } = weather;
    // SSE pushes carry no location name (only the HTTP response adds it),
    // so fall back to the selected location's label.
    const locName =
        loc.name ?? locationOptions.find((o) => o.id === (locationId ?? loc.id))?.label ?? "";
    const nowIdx = findNowIndex(hourly, cur.time);
    const nowHour = hourly[nowIdx] ?? {};
    const today = daily[0] ?? {};
    const tomorrow = daily[1] ?? {};

    // 25 h window (12 h back, 12 h ahead) behind each tile's sparkline.
    const sparkStart = Math.max(0, nowIdx - 12);
    const sparkWin = hourly.slice(sparkStart, nowIdx + 13);
    const sparkNow = nowIdx - sparkStart;
    const spark = (key) => sparkWin.map((h) => (Number.isFinite(h[key]) ? h[key] : null));
    const heat = heatHue(cur.temperature);
    const tc = (v) => conv(U.temp, v);

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

    const lat = Number(loc.latitude);
    const lon = Number(loc.longitude);
    const sun =
        Number.isFinite(lat) && Number.isFinite(lon) ? solarPosition(new Date(), lat, lon) : null;
    const dayDeltaSec =
        Number.isFinite(today.daylightDuration) && Number.isFinite(tomorrow.daylightDuration)
            ? tomorrow.daylightDuration - today.daylightDuration
            : null;
    const daylightSec = Number.isFinite(today.daylightDuration)
        ? today.daylightDuration
        : (localMs(today.sunset) - localMs(today.sunrise)) / 1000;
    const solarNoon =
        Number.isFinite(localMs(today.sunrise)) && Number.isFinite(localMs(today.sunset))
            ? new Date((localMs(today.sunrise) + localMs(today.sunset)) / 2)
                  .toISOString()
                  .slice(11, 16)
            : "--:--";

    // The moon is always part of the sun card. While it is below the horizon the
    // arc shows its next rise -> set; without moonrise/moonset data (older
    // cached payloads) the arc stays empty but the phase is still drawn.
    const moon = moonWindow(daily, cur.time) ?? {
        up: false,
        riseKnown: false,
        rise: null,
        set: null,
    };
    const moonPos =
        moon.up && Number.isFinite(lat) && Number.isFinite(lon)
            ? moonPosition(new Date(), lat, lon)
            : null;
    const illum = moonIllumination(today.moonPhase);
    const moonKey = moonPhaseKey(today.moonPhase);
    // Days until the next full moon (phase 0.5), wrapping around the cycle.
    const daysToFull = Number.isFinite(today.moonPhase)
        ? ((((0.5 - today.moonPhase) % 1) + 1) % 1) * SYNODIC_DAYS
        : null;

    // Twilight / golden hour (needs the location's UTC offset, like the data age).
    const cross = (alt) =>
        sun && Number.isFinite(loc.utcOffsetSeconds)
            ? solarCrossings(cur.time, loc.utcOffsetSeconds, lat, lon, alt)
            : { rising: null, falling: null };
    const civil = cross(-6);
    const golden = cross(6);
    const hm = (v) => v ?? "--:--";

    // Next 24 h outlook, straight from the hourly slots.
    const next24 = hourly.slice(nowIdx, nowIdx + 24);
    const peak = (key, pick) => {
        const finite = next24.filter((h) => Number.isFinite(h[key]));
        return finite.length ? finite.reduce((a, b) => (pick(b[key], a[key]) ? b : a)) : null;
    };
    const wet = (h) => h.precipitationSum >= 0.1;
    const wetNow = next24.length > 0 && wet(next24[0]);
    const rainChange = next24.find((h) => wet(h) !== wetNow);
    const gustPeak = peak("windGust", (a, b) => a > b);
    const uvPeak = peak("uvIndex", (a, b) => a > b);
    const tHigh = peak("temperature", (a, b) => a > b);
    const tLow = peak("temperature", (a, b) => a < b);
    const clock = (h) => (h ? `${h.time.slice(11, 16)}${dayShift(h.time, cur.time)}` : "--:--");

    const hours = RANGES.find((r) => r.id === rangeId)?.hours ?? 48;
    const start = Math.max(0, nowIdx - LOOKBACK_HOURS);
    const win = hourly.slice(start, start + hours);
    const times = win.map((h) => h.time);
    const col = (key, u) =>
        win.map((h) => (Number.isFinite(h[key]) ? (u ? u.f(h[key]) : h[key]) : null));
    const derive = (fn) =>
        win.map((h) => {
            const v = fn(h);
            return Number.isFinite(v) ? v : null;
        });
    const chartNow = nowIdx - start;

    // Fixed chart axes: UV always 0-10, precipitation always 0-5 mm. They only
    // grow when the plotted window actually exceeds that.
    const maxOf = (key, u) =>
        win.reduce(
            (m, h) => (Number.isFinite(h[key]) ? Math.max(m, u ? u.f(h[key]) : h[key]) : m),
            0,
        );
    const uvDomain = [0, Math.max(10, Math.ceil(maxOf("uvIndex")))];
    const precipBase = U.precip.f(5);
    const precipStep = precipBase / 5;
    const precipDomain = [
        0,
        Math.max(
            precipBase,
            Math.ceil(maxOf("precipitationSum", U.precip) / precipStep) * precipStep,
        ),
    ];

    // ---------- alerts ----------
    const alerts = evaluateAlerts(rules, hourly, nowIdx);
    const nowHits = new Set(alerts.filter((a) => a.nowHit).map((a) => a.rule.metric));
    const tileAlert = (id) => TILE_ALERT[id]?.some((m) => nowHits.has(m)) ?? false;
    const alertText = ({ rule, nowHit, hit }) => {
        const m = ALERT_METRICS[rule.metric];
        const u = m.dim ? U[m.dim] : null;
        const th = Number((u ? u.f(rule.value) : rule.value).toFixed(1));
        const val = Number((u ? u.f(hit.value) : hit.value).toFixed(1));
        const when = nowHit
            ? `${T.alerts.now} (${val})`
            : `${T.alerts.from} ${hit.time.slice(5, 16).replace("T", " ")}`;
        return `${T.alerts.metrics[rule.metric]} ${rule.op === ">=" ? "≥" : "≤"} ${th}${u?.u ?? m.unit} · ${when}`;
    };

    // ---------- tile detail (click a tile) ----------
    const sr = (key, label, color, values, unit, digits = 0, extra = {}) => ({
        key,
        label,
        color,
        values,
        unit,
        digits,
        ...extra,
    });
    const D = (title, value, unit, hint, series, extra = {}) => ({
        title,
        value,
        unit,
        hint,
        series,
        times,
        nowIndex: chartNow,
        nowLabel: T.now,
        ...extra,
    });
    const tu = U.temp.u;
    const details = {
        feelsLike: D(T.tiles.feelsLike, tc(cur.feelsLike), tu, T.hints.feelsLike, [
            sr("f", T.tiles.feelsLike, C.temp, col("feelsLike", U.temp), tu, 0, {
                area: true,
                extrema: true,
            }),
            sr("t", "T", C.feels, col("temperature", U.temp), tu, 0, { dashed: true }),
        ]),
        dewPoint: D(T.tiles.dewPoint, tc(td), tu, T.hints.dewPoint, [
            sr("d", "Td", C.dew, col("dewPoint", U.temp), tu, 1, { area: true, extrema: true }),
            sr("t", "T", C.temp, col("temperature", U.temp), tu, 0, { dashed: true }),
        ]),
        humidity: D(
            T.tiles.humidity,
            cur.humidity,
            "%",
            T.hints.humidity,
            [sr("rh", "RH", C.rh, col("humidity"), "%", 0, { area: true, extrema: true })],
            { domain: [0, 100] },
        ),
        wetBulb: D(T.tiles.wetBulb, tc(tw), tu, T.hints.wetBulb, [
            sr(
                "wb",
                T.tiles.wetBulb,
                C.dew,
                derive((h) => tc(wetBulb(h.temperature, h.humidity))),
                tu,
                1,
                { area: true, extrema: true },
            ),
        ]),
        pressure: D(
            T.tiles.pressure,
            conv(U.pressure, cur.pressureMsl),
            U.pressure.u,
            T.hints.pressure,
            [
                sr(
                    "p",
                    "MSL",
                    C.pressure,
                    col("pressureMsl", U.pressure),
                    U.pressure.u,
                    U.pressure.digits,
                    { area: true, extrema: true },
                ),
            ],
        ),
        cloud: D(
            T.tiles.cloud,
            cur.cloudCover,
            "%",
            T.hints.cloud,
            [
                sr("cc", T.tiles.cloud, C.cloud, col("cloudCover"), "%", 0, {
                    kind: "bar",
                    opacity: 0.3,
                }),
            ],
            { domain: [0, 100] },
        ),
        visibility: D(T.tiles.visibility, conv(U.dist, visKm), U.dist.u, T.hints.visibility, [
            sr(
                "v",
                T.tiles.visibility,
                "#94a3b8",
                derive((h) => conv(U.dist, h.visibility / 1000)),
                U.dist.u,
                1,
                { area: true, nonNegative: true },
            ),
        ]),
        precip: D(
            T.tiles.precip,
            conv(U.precip, cur.precipitation),
            U.precip.u,
            T.hints.precip,
            [
                sr(
                    "mm",
                    T.tiles.precip,
                    C.precip,
                    col("precipitationSum", U.precip),
                    U.precip.u,
                    U.precip.digits,
                    { kind: "bar", nonNegative: true },
                ),
                sr("pp", T.tiles.prob, C.prob, col("precipitation"), "%", 0, {
                    axis: "right",
                    dashed: true,
                    nonNegative: true,
                }),
            ],
            { domain: precipDomain, rightDomain: [0, 100] },
        ),
        uv: D(
            T.tiles.uv,
            nowHour.uvIndex,
            "",
            T.hints.uv,
            [
                sr("uv", "UV", C.uv, col("uvIndex"), "", 1, {
                    area: true,
                    extrema: true,
                    nonNegative: true,
                }),
            ],
            { domain: uvDomain },
        ),
        wbgt: D(T.tiles.wbgt, tc(wbgt), tu, T.hints.wbgt, [
            sr(
                "wbgt",
                "WBGT",
                C.temp,
                derive((h) =>
                    tc(
                        estimateWbgt({
                            temp: h.temperature,
                            humidity: h.humidity,
                            radiationWm2: h.shortwaveRadiation,
                            windMs: h.windSpeed,
                        }),
                    ),
                ),
                tu,
                1,
                { area: true, extrema: true },
            ),
        ]),
        cape: D(T.tiles.cape, nowHour.cape, "J/kg", T.hints.cape, [
            sr("cape", "CAPE", C.cape, col("cape"), "J/kg", 0, {
                area: true,
                extrema: true,
                nonNegative: true,
            }),
        ]),
        freezing: D(
            T.tiles.freezing,
            conv(U.alt, nowHour.freezingLevel),
            U.alt.u,
            T.hints.freezing,
            [
                sr("fl", T.tiles.freezing, "#67e8f9", col("freezingLevel", U.alt), U.alt.u, 0, {
                    area: true,
                    extrema: true,
                }),
            ],
        ),
    };

    // Data age needs the location's UTC offset (added to the payload with the
    // weather page; older cached payloads simply don't show an age).
    const ageMin = Number.isFinite(loc.utcOffsetSeconds)
        ? Math.max(
              0,
              Math.round(
                  (Date.now() - (Date.parse(`${cur.time}Z`) - loc.utcOffsetSeconds * 1000)) / 60000,
              ),
          )
        : null;
    const weekdays = lang.dateNames?.weekdaysShort ?? [];
    const dayName = (iso) => {
        const d = new Date(`${iso}T00:00:00Z`);
        return `${iso.slice(5)} ${weekdays[d.getUTCDay()] ?? ""}`;
    };

    return (
        <div className="wxp">
            {renderHeader(alerts.length)}

            {expanded && details[expanded] && (
                <TileDetail
                    detail={details[expanded]}
                    T={T.detail}
                    onClose={() => setExpanded(null)}
                />
            )}
            {alertOpen && (
                <AlertPanel
                    rules={rules}
                    setRules={setRules}
                    units={U}
                    T={T.alerts}
                    onClose={() => setAlertOpen(false)}
                />
            )}

            <div className="wxp-dash">
                {/* ---------- left column: hero / wind / sun + moon ---------- */}
                <aside className="wxp-side">
                    {/* hero */}
                    <section
                        className="wxp-hero"
                        style={{
                            "--heat": `hsl(${heat} 92% 62%)`,
                            "--heat-soft": `hsl(${heat} 92% 62% / 0.18)`,
                        }}
                    >
                        <Sparkline
                            className="wxp-hero__spark"
                            values={col("temperature")}
                            nowIndex={chartNow}
                            area
                            dot={false}
                        />
                        <div className="wxp-hero__main">
                            <div className="wxp-hero__loc">{locName}</div>
                            <div className="wxp-hero__temp">
                                <CountUp value={tc(cur.temperature)} />
                                <span>{U.temp.u}</span>
                            </div>
                            <div className="wxp-hero__desc">
                                {cur.description} <em>WMO {cur.weatherCode}</em>
                            </div>
                        </div>
                        <dl className="wxp-hero__meta">
                            <div>
                                <dt>{T.hero.dataTime}</dt>
                                <dd>
                                    <i
                                        className={`wxp-pulse${ageMin !== null && ageMin > 60 ? " is-stale" : ""}`}
                                    />
                                    {cur.time?.replace("T", " ")}{" "}
                                    {ageMin !== null && (
                                        <em>
                                            ({ageMin} {T.hero.minAgo})
                                        </em>
                                    )}
                                </dd>
                            </div>
                            <div>
                                <dt>{T.hero.position}</dt>
                                <dd>
                                    {formatCoord(lat, "N", "S")} {formatCoord(lon, "E", "W")}
                                </dd>
                            </div>
                            <div>
                                <dt>{T.hero.timezone}</dt>
                                <dd>{loc.timezone ?? "--"}</dd>
                            </div>
                            <div>
                                <dt>{T.hero.today}</dt>
                                <dd>
                                    {fmt(tc(today.high))}° / {fmt(tc(today.low))}°
                                </dd>
                            </div>
                        </dl>
                    </section>

                    {/* alerts (always present so the layout never jumps) */}
                    <section
                        className="wxp-alertrow"
                        role={alerts.length > 0 ? "alert" : undefined}
                    >
                        <Bell size={13} className="wxp-alertrow__icon" />
                        {alerts.length > 0 ? (
                            <div className="wxp-alerts">
                                {alerts.map((a) => (
                                    <span key={a.rule.id} className={a.nowHit ? "is-now" : ""}>
                                        {alertText(a)}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <span className="wxp-alertrow__none">{T.alerts.none}</span>
                        )}
                    </section>

                    {/* next 24 h (left) + wind (right) */}
                    <div className="wxp-duo">
                        {/* next 24 h outlook */}
                        <Card title={T.outlook.title} className="wxp-card--grow wxp-card--outlook">
                            <dl className="wxp-kv">
                                <div>
                                    <dt>
                                        {wetNow
                                            ? T.outlook.rainStops
                                            : rainChange
                                              ? T.outlook.rainStarts
                                              : T.outlook.dry}
                                    </dt>
                                    <dd>
                                        {rainChange
                                            ? clock(rainChange)
                                            : wetNow
                                              ? ">24 h"
                                              : T.outlook.dryValue}
                                    </dd>
                                </div>
                                <div>
                                    <dt>{T.outlook.gust}</dt>
                                    <dd>
                                        {gustPeak
                                            ? `${fmt(conv(U.wind, gustPeak.windGust), 1)} ${U.wind.u} · ${clock(gustPeak)}`
                                            : "--"}
                                    </dd>
                                </div>
                                <div>
                                    <dt>{T.outlook.uv}</dt>
                                    <dd>
                                        {uvPeak && uvPeak.uvIndex > 0
                                            ? `${fmt(uvPeak.uvIndex, 1)} · ${clock(uvPeak)}`
                                            : "--"}
                                    </dd>
                                </div>
                                <div>
                                    <dt>{T.outlook.high}</dt>
                                    <dd>
                                        {tHigh
                                            ? `${fmt(tc(tHigh.temperature))}${U.temp.u} · ${clock(tHigh)}`
                                            : "--"}
                                    </dd>
                                </div>
                                <div>
                                    <dt>{T.outlook.low}</dt>
                                    <dd>
                                        {tLow
                                            ? `${fmt(tc(tLow.temperature))}${U.temp.u} · ${clock(tLow)}`
                                            : "--"}
                                    </dd>
                                </div>
                            </dl>
                        </Card>

                        {/* wind */}
                        <Card title={T.wind.title} className="wxp-card--grow wxp-card--wind">
                            <div className="wxp-windcard">
                                <Compass
                                    degrees={cur.windDirection}
                                    speed={cur.windSpeed}
                                    gust={cur.windGust}
                                    unit={U.wind.u}
                                    shown={conv(U.wind, cur.windSpeed)}
                                />
                                <dl className="wxp-kv">
                                    <div>
                                        <dt>{T.wind.from}</dt>
                                        <dd>
                                            {toCardinal(cur.windDirection)} {fmt(cur.windDirection)}
                                            °
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>{T.wind.gust}</dt>
                                        <dd>
                                            {fmt(conv(U.wind, cur.windGust), 1)} {U.wind.u}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>{T.wind.gustFactor}</dt>
                                        <dd>
                                            {gustFactor === null ? "--" : `×${fmt(gustFactor, 2)}`}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>{T.wind.beaufort}</dt>
                                        <dd>
                                            {force === null
                                                ? "--"
                                                : `${force} · ${T.wind.names[force]}`}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>{T.wind.dailyMax}</dt>
                                        <dd>
                                            {fmt(conv(U.wind, today.windSpeed), 1)} /{" "}
                                            {fmt(conv(U.wind, today.windGust), 1)} {U.wind.u}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>{T.wind.dominant}</dt>
                                        <dd>
                                            {toCardinal(today.windDirection)}{" "}
                                            {fmt(today.windDirection)}°
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </Card>
                    </div>

                    {/* sun (+ moon while it is above the horizon) */}
                    <Card title={`${T.sun.title} / ${T.moon.title}`} className="wxp-card--fill">
                        <div className="wxp-celestial has-moon">
                            <div className="wxp-body">
                                <SunArc
                                    sunrise={today.sunrise}
                                    sunset={today.sunset}
                                    now={cur.time}
                                />
                                <dl className="wxp-kv">
                                    <div>
                                        <dt>
                                            {T.sun.sunrise} / {T.sun.sunset}
                                        </dt>
                                        <dd>
                                            {hhmm(today.sunrise)} / {hhmm(today.sunset)}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>{T.sun.solarNoon}</dt>
                                        <dd>{solarNoon}</dd>
                                    </div>
                                    <div>
                                        <dt>{T.sun.daylight}</dt>
                                        <dd>
                                            {formatDuration(daylightSec)}{" "}
                                            <em>
                                                {dayDeltaSec === null
                                                    ? ""
                                                    : `(${fmtSigned(dayDeltaSec / 60, 1)} min ${T.sun.tomorrow})`}
                                            </em>
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>{T.sun.sunshine}</dt>
                                        <dd>{formatDuration(today.sunshineDuration)}</dd>
                                    </div>
                                    <div>
                                        <dt>{T.sun.altitude}</dt>
                                        <dd>
                                            {sun ? `${fmt(sun.altitude, 1)}°` : "--"}{" "}
                                            <em>
                                                {sun
                                                    ? `${T.sun.max} ${fmt(noonAltitude(lat, sun.declination), 1)}°`
                                                    : ""}
                                            </em>
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>{T.sun.azimuth}</dt>
                                        <dd>
                                            {sun
                                                ? `${fmt(sun.azimuth, 1)}° ${toCardinal(sun.azimuth)}`
                                                : "--"}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>{T.sun.civil}</dt>
                                        <dd>
                                            {hm(civil.rising)} / {hm(civil.falling)}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>{T.sun.golden}</dt>
                                        <dd>
                                            {hm(golden.rising)} / {hm(golden.falling)}
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="wxp-body wxp-body--moon">
                                <div className="wxp-moonvis">
                                    <SunArc
                                        body="moon"
                                        sunrise={moon.rise}
                                        sunset={moon.set}
                                        now={cur.time}
                                        phase={today.moonPhase}
                                        riseLabel={moon.riseKnown ? undefined : "--:--"}
                                    />
                                    {/* today's phase, centred under the arc's dome */}
                                    <MoonPhase phase={today.moonPhase} flip={lat < 0} />
                                </div>
                                <dl className="wxp-kv">
                                    <div>
                                        <dt>
                                            {T.moon.moonrise} / {T.moon.moonset}
                                        </dt>
                                        <dd>
                                            {moon.riseKnown
                                                ? `${hhmm(moon.rise)}${dayShift(moon.rise, cur.time)}`
                                                : "--:--"}{" "}
                                            / {hhmm(moon.set)}
                                            {dayShift(moon.set, cur.time)}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>{T.moon.phase}</dt>
                                        <dd>{moonKey ? T.moon.names[moonKey] : "--"}</dd>
                                    </div>
                                    <div>
                                        <dt>{T.moon.illumination}</dt>
                                        <dd>{illum === null ? "--" : `${fmt(illum * 100)}%`}</dd>
                                    </div>
                                    <div>
                                        <dt>{T.moon.age}</dt>
                                        <dd>
                                            {Number.isFinite(today.moonPhase)
                                                ? `${fmt(today.moonPhase * SYNODIC_DAYS, 1)} ${T.moon.days}`
                                                : "--"}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>{T.sun.altitude}</dt>
                                        <dd>{moonPos ? `${fmt(moonPos.altitude, 1)}°` : "--"}</dd>
                                    </div>
                                    <div>
                                        <dt>{T.sun.azimuth}</dt>
                                        <dd>
                                            {moonPos
                                                ? `${fmt(moonPos.azimuth, 1)}° ${toCardinal(moonPos.azimuth)}`
                                                : "--"}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>{T.moon.visible}</dt>
                                        <dd>
                                            {moon.riseKnown
                                                ? formatDuration(
                                                      (localMs(moon.set) - localMs(moon.rise)) /
                                                          1000,
                                                  )
                                                : "--"}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>{T.moon.nextFull}</dt>
                                        <dd>
                                            {daysToFull === null
                                                ? "--"
                                                : `${fmt(daysToFull, 1)} ${T.moon.days}`}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </Card>
                </aside>

                {/* ---------- right column: instruments + trend charts ---------- */}
                <div className="wxp-main">
                    <div className="wxp-tiles">
                        <Tile
                            id="feelsLike"
                            alert={tileAlert("feelsLike")}
                            onOpen={setExpanded}
                            label={T.tiles.feelsLike}
                            value={<CountUp value={tc(cur.feelsLike)} digits={0} />}
                            unit={U.temp.u}
                            sub={`Δ ${fmtSigned(U.temp.d(cur.feelsLike - cur.temperature))}°`}
                            hint={T.hints.feelsLike}
                            accent={C.temp}
                            spark={spark("feelsLike")}
                            sparkNow={sparkNow}
                        />
                        <Tile
                            id="dewPoint"
                            alert={tileAlert("dewPoint")}
                            onOpen={setExpanded}
                            label={T.tiles.dewPoint}
                            value={<CountUp value={tc(td)} digits={1} />}
                            unit={U.temp.u}
                            sub={`${T.tiles.spread} ${fmt(spread === null ? null : U.temp.d(spread), 1)}°`}
                            hint={T.hints.dewPoint}
                            accent={C.dew}
                            spark={spark("dewPoint")}
                            sparkNow={sparkNow}
                        />
                        <Tile
                            id="humidity"
                            alert={tileAlert("humidity")}
                            onOpen={setExpanded}
                            label={T.tiles.humidity}
                            value={<CountUp value={cur.humidity} digits={0} />}
                            unit="%"
                            sub={`VPD ${fmt(vpd, 2)} kPa`}
                            hint={T.hints.humidity}
                            accent={C.rh}
                            spark={spark("humidity")}
                            sparkNow={sparkNow}
                        />
                        <Tile
                            id="wetBulb"
                            alert={tileAlert("wetBulb")}
                            onOpen={setExpanded}
                            label={T.tiles.wetBulb}
                            value={<CountUp value={tc(tw)} digits={1} />}
                            unit={U.temp.u}
                            sub={`T − Tw ${fmt(tw === null ? null : U.temp.d(cur.temperature - tw), 1)}°`}
                            hint={T.hints.wetBulb}
                            accent={C.dew}
                            gauge={frac(tw, 0, 35)}
                        />
                        <Tile
                            id="pressure"
                            alert={tileAlert("pressure")}
                            onOpen={setExpanded}
                            label={T.tiles.pressure}
                            value={
                                <CountUp
                                    value={conv(U.pressure, cur.pressureMsl)}
                                    digits={U.pressure.digits}
                                />
                            }
                            unit={U.pressure.u}
                            sub={
                                tendency ? (
                                    <span className="wxp-tile__trend">
                                        <TendencyIcon tendency={tendency} />
                                        {T.tendency[tendency.key]}{" "}
                                        {fmtSigned(U.pressure.f(tendency.delta), U.pressure.digits)}{" "}
                                        {U.pressure.u}/3h
                                    </span>
                                ) : (
                                    `stn ${fmt(conv(U.pressure, cur.surfacePressure), U.pressure.digits)}`
                                )
                            }
                            hint={T.hints.pressure}
                            accent={C.pressure}
                            spark={spark("pressureMsl")}
                            sparkNow={sparkNow}
                        />
                        <Tile
                            id="cloud"
                            alert={tileAlert("cloud")}
                            onOpen={setExpanded}
                            label={T.tiles.cloud}
                            value={<CountUp value={cur.cloudCover} digits={0} />}
                            unit="%"
                            sub={
                                cloudBase === null
                                    ? "—"
                                    : `${T.tiles.base} ≈ ${fmt(conv(U.alt, cloudBase))} ${U.alt.u}`
                            }
                            hint={T.hints.cloud}
                            accent={C.cloud}
                            spark={spark("cloudCover")}
                            sparkNow={sparkNow}
                        />
                        <Tile
                            id="visibility"
                            alert={tileAlert("visibility")}
                            onOpen={setExpanded}
                            label={T.tiles.visibility}
                            value={<CountUp value={conv(U.dist, visKm)} digits={1} />}
                            unit={U.dist.u}
                            sub={T.tiles.hourlyModel}
                            hint={T.hints.visibility}
                            accent="#94a3b8"
                            spark={spark("visibility")}
                            sparkNow={sparkNow}
                        />
                        <Tile
                            id="precip"
                            alert={tileAlert("precip")}
                            onOpen={setExpanded}
                            label={T.tiles.precip}
                            value={
                                <CountUp
                                    value={conv(U.precip, cur.precipitation)}
                                    digits={U.precip.digits}
                                />
                            }
                            unit={U.precip.u}
                            sub={`${T.tiles.prob} ${fmt(nowHour.precipitation)}%`}
                            hint={T.hints.precip}
                            accent={C.precip}
                            spark={spark("precipitationSum")}
                            sparkNow={sparkNow}
                        />
                        <Tile
                            id="uv"
                            alert={tileAlert("uv")}
                            onOpen={setExpanded}
                            label={T.tiles.uv}
                            value={<CountUp value={nowHour.uvIndex} digits={1} />}
                            tone={uvClass?.tone}
                            sub={
                                uvClass
                                    ? `${T.uvLevels[uvClass.key]} · max ${fmt(today.uvIndex, 1)}`
                                    : "—"
                            }
                            hint={T.hints.uv}
                            accent={C.uv}
                            gauge={frac(nowHour.uvIndex, 0, 11)}
                        />
                        <Tile
                            id="wbgt"
                            alert={tileAlert("wbgt")}
                            onOpen={setExpanded}
                            label={T.tiles.wbgt}
                            value={<CountUp value={tc(wbgt)} digits={1} />}
                            unit={U.temp.u}
                            tone={wbgtClass?.tone}
                            sub={wbgtClass ? T.wbgtLevels[wbgtClass.key] : "—"}
                            hint={T.hints.wbgt}
                            accent={C.temp}
                            gauge={frac(wbgt, 10, 35)}
                        />
                        <Tile
                            id="cape"
                            alert={tileAlert("cape")}
                            onOpen={setExpanded}
                            label={T.tiles.cape}
                            value={<CountUp value={nowHour.cape} digits={0} />}
                            unit="J/kg"
                            tone={capeClass?.tone}
                            sub={capeClass ? T.capeLevels[capeClass.key] : "—"}
                            hint={T.hints.cape}
                            accent={C.cape}
                            gauge={frac(nowHour.cape, 0, 2500)}
                        />
                        <Tile
                            id="freezing"
                            alert={tileAlert("freezing")}
                            onOpen={setExpanded}
                            label={T.tiles.freezing}
                            value={
                                <CountUp value={conv(U.alt, nowHour.freezingLevel)} digits={0} />
                            }
                            unit={U.alt.u}
                            sub="0 °C isotherm"
                            hint={T.hints.freezing}
                            accent="#67e8f9"
                            spark={spark("freezingLevel")}
                            sparkNow={sparkNow}
                        />
                    </div>

                    {/* ---------- trends ---------- */}
                    <div className="wxp-charts">
                        <Card title={T.charts.temperature}>
                            <TimeSeries
                                times={times}
                                nowIndex={chartNow}
                                nowLabel={T.now}
                                labels={T.detail.chart}
                                series={[
                                    {
                                        key: "t",
                                        area: true,
                                        extrema: true,
                                        label: "T",
                                        color: C.temp,
                                        values: col("temperature", U.temp),
                                        unit: U.temp.u,
                                    },
                                    {
                                        key: "f",
                                        label: "Feels",
                                        color: C.feels,
                                        values: col("feelsLike", U.temp),
                                        unit: U.temp.u,
                                        dashed: true,
                                    },
                                    {
                                        key: "d",
                                        label: "Td",
                                        color: C.dew,
                                        values: col("dewPoint", U.temp),
                                        unit: U.temp.u,
                                        digits: 1,
                                    },
                                ]}
                            />
                        </Card>
                        <Card title={T.charts.humidity}>
                            <TimeSeries
                                times={times}
                                nowIndex={chartNow}
                                nowLabel={T.now}
                                labels={T.detail.chart}
                                leftDomain={[0, 100]}
                                series={[
                                    {
                                        key: "rh",
                                        area: true,
                                        label: "RH",
                                        color: C.rh,
                                        values: col("humidity"),
                                        unit: "%",
                                    },
                                    {
                                        key: "cc",
                                        label: "Cloud",
                                        color: C.cloud,
                                        values: col("cloudCover"),
                                        unit: "%",
                                        kind: "bar",
                                        opacity: 0.25,
                                    },
                                ]}
                            />
                        </Card>
                        <Card title={T.charts.pressure}>
                            <TimeSeries
                                times={times}
                                nowIndex={chartNow}
                                nowLabel={T.now}
                                labels={T.detail.chart}
                                series={[
                                    {
                                        key: "p",
                                        area: true,
                                        extrema: true,
                                        label: "MSL",
                                        color: C.pressure,
                                        values: col("pressureMsl", U.pressure),
                                        unit: U.pressure.u,
                                        digits: U.pressure.digits,
                                    },
                                ]}
                            />
                        </Card>
                        <Card title={T.charts.wind}>
                            <TimeSeries
                                times={times}
                                nowIndex={chartNow}
                                nowLabel={T.now}
                                labels={T.detail.chart}
                                series={[
                                    {
                                        key: "w",
                                        area: true,
                                        label: "Wind",
                                        nonNegative: true,
                                        color: C.wind,
                                        values: col("windSpeed", U.wind),
                                        unit: U.wind.u,
                                        digits: 1,
                                    },
                                    {
                                        key: "g",
                                        label: "Gust",
                                        nonNegative: true,
                                        color: C.gust,
                                        values: col("windGust", U.wind),
                                        unit: U.wind.u,
                                        digits: 1,
                                        dashed: true,
                                    },
                                ]}
                            />
                        </Card>
                        <Card title={T.charts.precip}>
                            <TimeSeries
                                times={times}
                                nowIndex={chartNow}
                                nowLabel={T.now}
                                labels={T.detail.chart}
                                leftDomain={precipDomain}
                                rightDomain={[0, 100]}
                                series={[
                                    {
                                        key: "mm",
                                        label: "Precip",
                                        nonNegative: true,
                                        color: C.precip,
                                        kind: "bar",
                                        values: col("precipitationSum", U.precip),
                                        unit: U.precip.u,
                                        digits: U.precip.digits,
                                    },
                                    {
                                        key: "pp",
                                        label: "Prob",
                                        nonNegative: true,
                                        color: C.prob,
                                        axis: "right",
                                        values: col("precipitation"),
                                        unit: "%",
                                        dashed: true,
                                    },
                                ]}
                            />
                        </Card>
                        <Card title={T.charts.instability}>
                            <TimeSeries
                                times={times}
                                nowIndex={chartNow}
                                nowLabel={T.now}
                                labels={T.detail.chart}
                                leftDomain={uvDomain}
                                series={[
                                    {
                                        key: "uv",
                                        area: true,
                                        label: "UV",
                                        nonNegative: true,
                                        color: C.uv,
                                        values: col("uvIndex"),
                                        digits: 1,
                                    },
                                    {
                                        key: "cape",
                                        label: "CAPE",
                                        nonNegative: true,
                                        color: C.cape,
                                        axis: "right",
                                        values: col("cape"),
                                        unit: "J/kg",
                                    },
                                ]}
                            />
                        </Card>
                    </div>
                </div>

                {/* ---------- bottom row: 7-day table + raw hourly ---------- */}
                <div className="wxp-bottom">
                    <Card title={T.sections.week} className="wxp-card--table">
                        <div className="wxp-tablewrap">
                            <table className="wxp-table">
                                <thead>
                                    <tr>
                                        <th>{T.week.date}</th>
                                        <th>WMO</th>
                                        <th>Hi/Lo {U.temp.u}</th>
                                        <th>Feels {U.temp.u}</th>
                                        <th>{U.precip.u}</th>
                                        <th>h</th>
                                        <th>Pop %</th>
                                        <th>Wind/Gust {U.wind.u}</th>
                                        <th>Dir</th>
                                        <th>UV</th>
                                        <th>↑</th>
                                        <th>↓</th>
                                        <th>{T.week.daylight}</th>
                                        <th>{T.week.sunshine}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {daily.map((d, i) => (
                                        <tr key={d.date} className={i === 0 ? "is-today" : ""}>
                                            <td>{dayName(d.date)}</td>
                                            <td title={d.description}>{d.weatherCode}</td>
                                            <td style={heatCell(d.high)}>
                                                {fmt(tc(d.high))} / {fmt(tc(d.low))}
                                            </td>
                                            <td>
                                                {fmt(tc(d.feelsLikeHigh))} /{" "}
                                                {fmt(tc(d.feelsLikeLow))}
                                            </td>
                                            <td style={tint(d.precipitationSum, 0, 30, 210)}>
                                                {fmt(
                                                    conv(U.precip, d.precipitationSum),
                                                    U.precip.digits,
                                                )}
                                            </td>
                                            <td>{fmt(d.precipitationHours)}</td>
                                            <td style={tint(d.precipitation, 0, 100, 210)}>
                                                {fmt(d.precipitation)}
                                            </td>
                                            <td>
                                                {fmt(conv(U.wind, d.windSpeed), 1)} /{" "}
                                                {fmt(conv(U.wind, d.windGust), 1)}
                                            </td>
                                            <td>{toCardinal(d.windDirection)}</td>
                                            <td style={tint(d.uvIndex, 0, 11, 330)}>
                                                {fmt(d.uvIndex, 1)}
                                            </td>
                                            <td>{hhmm(d.sunrise)}</td>
                                            <td>{hhmm(d.sunset)}</td>
                                            <td>{formatDuration(d.daylightDuration)}</td>
                                            <td>{formatDuration(d.sunshineDuration)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    <Card title={T.sections.raw} className="wxp-card--table">
                        <div className="wxp-tablewrap">
                            <table className="wxp-table">
                                <thead>
                                    <tr>
                                        <th>Time</th>
                                        <th>T</th>
                                        <th>Feels</th>
                                        <th>Td</th>
                                        <th>RH</th>
                                        <th>P {U.pressure.u}</th>
                                        <th>Cld</th>
                                        <th>Vis {U.dist.u}</th>
                                        <th>Wind {U.wind.u}</th>
                                        <th>Gust</th>
                                        <th>Dir</th>
                                        <th>{U.precip.u}</th>
                                        <th>Pop</th>
                                        <th>UV</th>
                                        <th>CAPE</th>
                                        <th>Rad W/m²</th>
                                        <th>WMO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {hourly.slice(nowIdx, nowIdx + 48).map((h, i) => (
                                        <tr key={h.time} className={i === 0 ? "is-today" : ""}>
                                            <td>{h.time.slice(5, 16).replace("T", " ")}</td>
                                            <td style={heatCell(h.temperature)}>
                                                {fmt(tc(h.temperature))}
                                            </td>
                                            <td>{fmt(tc(h.feelsLike))}</td>
                                            <td>{fmt(tc(h.dewPoint), 1)}</td>
                                            <td>{fmt(h.humidity)}</td>
                                            <td>
                                                {fmt(
                                                    conv(U.pressure, h.pressureMsl),
                                                    U.pressure.digits,
                                                )}
                                            </td>
                                            <td>{fmt(h.cloudCover)}</td>
                                            <td>
                                                {fmt(
                                                    Number.isFinite(h.visibility)
                                                        ? conv(U.dist, h.visibility / 1000)
                                                        : null,
                                                    1,
                                                )}
                                            </td>
                                            <td>{fmt(conv(U.wind, h.windSpeed), 1)}</td>
                                            <td>{fmt(conv(U.wind, h.windGust), 1)}</td>
                                            <td>{toCardinal(h.windDirection)}</td>
                                            <td style={tint(h.precipitationSum, 0, 10, 210)}>
                                                {fmt(
                                                    conv(U.precip, h.precipitationSum),
                                                    U.precip.digits,
                                                )}
                                            </td>
                                            <td style={tint(h.precipitation, 0, 100, 210)}>
                                                {fmt(h.precipitation)}
                                            </td>
                                            <td style={tint(h.uvIndex, 0, 11, 330)}>
                                                {fmt(h.uvIndex, 1)}
                                            </td>
                                            <td style={tint(h.cape, 0, 2500, 0)}>{fmt(h.cape)}</td>
                                            <td>{fmt(h.shortwaveRadiation)}</td>
                                            <td>{h.weatherCode}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
