// ===================================================
// ファイル名: WeatherPage.jsx
// 作成日: 2026/10/21
// 概要: 独立した天気ページ（サイドバー「天気」セクション）
//       計器タイル・風/太陽(+月)・時系列チャート・7日間表・時間別生データ表を
//       ページ全体のスクロール無しで一画面に収めて表示する。
//       データは既存の useWeather / GET /weather をそのまま利用する。
// ===================================================

import { useEffect, useState } from "react";
import { RefreshCw, MapPin, ArrowUp, ArrowDown, ArrowRight } from "lucide-react";

import useWeather from "../useWeather";
import { useLocation } from "../../locations/useLocation";
import { useSettings } from "../../settings/useSettings";
import { useLanguage } from "../../settings/useLanguage";

import TimeSeries from "../components/TimeSeries";
import Compass from "../components/Compass";
import SunArc from "../components/SunArc";
import Sparkline from "../components/Sparkline";
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
    const d = Math.round((Date.parse(iso.slice(0, 10)) - Date.parse(ref.slice(0, 10))) / 86400000);
    return d === 0 ? "" : ` (${d > 0 ? "+" : ""}${d}d)`;
};

const heatCell = (v) => (Number.isFinite(v) ? glow(heatHue(v), 0.7) : undefined);

function Tile({
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
            className={`wxp-tile${tone ? ` wxp-tile--${tone}` : ""}`}
            style={tone || !accent ? undefined : { "--accent": accent }}
            title={hint}
        >
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
    const { settings } = useSettings();

    const [locationId, setLocationId] = useState(null);
    const [rangeId, setRangeId] = useState("h48");

    // Resolve a starting location once the list is known. Until then the
    // backend falls back to the user's default location on its own.
    useEffect(() => {
        if (locationId || locationOptions.length === 0) return;
        setLocationId(settings?.preferences?.locationId ?? locationOptions[0].id);
    }, [locationId, locationOptions, settings?.preferences?.locationId]);

    const { weather, loading, error, refresh } = useWeather(locationId ?? undefined);

    const header = (
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
                {header}
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

    // The moon joins the sun card whenever it is above the horizon (day or
    // night). Needs the moonrise/moonset fields; older cached payloads simply
    // show the sun alone.
    const moonSpan = moonWindow(daily, cur.time);
    const moon = moonSpan?.up ? moonSpan : null;
    const moonPos =
        moon && Number.isFinite(lat) && Number.isFinite(lon)
            ? moonPosition(new Date(), lat, lon)
            : null;
    const illum = moonIllumination(today.moonPhase);
    const moonKey = moonPhaseKey(today.moonPhase);

    const hours = RANGES.find((r) => r.id === rangeId)?.hours ?? 48;
    const start = Math.max(0, nowIdx - LOOKBACK_HOURS);
    const win = hourly.slice(start, start + hours);
    const times = win.map((h) => h.time);
    const col = (key) => win.map((h) => (Number.isFinite(h[key]) ? h[key] : null));
    const chartNow = nowIdx - start;

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
            {header}

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
                                {fmt(cur.temperature)}
                                <span>°C</span>
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
                                    {fmt(today.high)}° / {fmt(today.low)}°
                                </dd>
                            </div>
                        </dl>
                    </section>

                    {/* wind */}
                    <Card title={T.wind.title} className="wxp-card--grow">
                        <div className="wxp-windcard">
                            <Compass
                                degrees={cur.windDirection}
                                speed={cur.windSpeed}
                                gust={cur.windGust}
                            />
                            <dl className="wxp-kv">
                                <div>
                                    <dt>{T.wind.from}</dt>
                                    <dd>
                                        {toCardinal(cur.windDirection)} {fmt(cur.windDirection)}°
                                    </dd>
                                </div>
                                <div>
                                    <dt>{T.wind.gust}</dt>
                                    <dd>{fmt(cur.windGust, 1)} m/s</dd>
                                </div>
                                <div>
                                    <dt>{T.wind.gustFactor}</dt>
                                    <dd>{gustFactor === null ? "--" : `×${fmt(gustFactor, 2)}`}</dd>
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
                                        {fmt(today.windSpeed, 1)} / {fmt(today.windGust, 1)} m/s
                                    </dd>
                                </div>
                                <div>
                                    <dt>{T.wind.dominant}</dt>
                                    <dd>
                                        {toCardinal(today.windDirection)} {fmt(today.windDirection)}
                                        °
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </Card>

                    {/* sun (+ moon while it is above the horizon) */}
                    <Card
                        title={moon ? `${T.sun.title} / ${T.moon.title}` : T.sun.title}
                        className="wxp-card--fill"
                    >
                        <div className={`wxp-celestial${moon ? " has-moon" : ""}`}>
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
                                </dl>
                            </div>

                            {moon && (
                                <div className="wxp-body wxp-body--moon">
                                    <SunArc
                                        body="moon"
                                        sunrise={moon.rise}
                                        sunset={moon.set}
                                        now={cur.time}
                                        phase={today.moonPhase}
                                        riseLabel={moon.riseKnown ? undefined : "--:--"}
                                    />
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
                                            <dd>
                                                {illum === null ? "--" : `${fmt(illum * 100)}%`}
                                            </dd>
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
                                            <dd>
                                                {moonPos ? `${fmt(moonPos.altitude, 1)}°` : "--"}
                                            </dd>
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
                                    </dl>
                                </div>
                            )}
                        </div>
                    </Card>
                </aside>

                {/* ---------- right column: instruments + trend charts ---------- */}
                <div className="wxp-main">
                    <div className="wxp-tiles">
                        <Tile
                            label={T.tiles.feelsLike}
                            value={fmt(cur.feelsLike)}
                            unit="°C"
                            sub={`Δ ${fmtSigned(cur.feelsLike - cur.temperature)}°`}
                            hint={T.hints.feelsLike}
                            accent={C.temp}
                            spark={spark("feelsLike")}
                            sparkNow={sparkNow}
                        />
                        <Tile
                            label={T.tiles.dewPoint}
                            value={fmt(td, 1)}
                            unit="°C"
                            sub={`${T.tiles.spread} ${fmt(spread, 1)}°`}
                            hint={T.hints.dewPoint}
                            accent={C.dew}
                            spark={spark("dewPoint")}
                            sparkNow={sparkNow}
                        />
                        <Tile
                            label={T.tiles.humidity}
                            value={fmt(cur.humidity)}
                            unit="%"
                            sub={`VPD ${fmt(vpd, 2)} kPa`}
                            hint={T.hints.humidity}
                            accent={C.rh}
                            spark={spark("humidity")}
                            sparkNow={sparkNow}
                        />
                        <Tile
                            label={T.tiles.wetBulb}
                            value={fmt(tw, 1)}
                            unit="°C"
                            sub={`T − Tw ${fmt(tw === null ? null : cur.temperature - tw, 1)}°`}
                            hint={T.hints.wetBulb}
                            accent={C.dew}
                            gauge={frac(tw, 0, 35)}
                        />
                        <Tile
                            label={T.tiles.pressure}
                            value={fmt(cur.pressureMsl, 1)}
                            unit="hPa"
                            sub={
                                tendency ? (
                                    <span className="wxp-tile__trend">
                                        <TendencyIcon tendency={tendency} />
                                        {T.tendency[tendency.key]} {fmtSigned(tendency.delta, 1)}{" "}
                                        hPa/3h
                                    </span>
                                ) : (
                                    `stn ${fmt(cur.surfacePressure, 1)}`
                                )
                            }
                            hint={T.hints.pressure}
                            accent={C.pressure}
                            spark={spark("pressureMsl")}
                            sparkNow={sparkNow}
                        />
                        <Tile
                            label={T.tiles.cloud}
                            value={fmt(cur.cloudCover)}
                            unit="%"
                            sub={cloudBase === null ? "—" : `${T.tiles.base} ≈ ${fmt(cloudBase)} m`}
                            hint={T.hints.cloud}
                            accent={C.cloud}
                            spark={spark("cloudCover")}
                            sparkNow={sparkNow}
                        />
                        <Tile
                            label={T.tiles.visibility}
                            value={fmt(visKm, 1)}
                            unit="km"
                            sub={T.tiles.hourlyModel}
                            hint={T.hints.visibility}
                            accent="#94a3b8"
                            spark={spark("visibility")}
                            sparkNow={sparkNow}
                        />
                        <Tile
                            label={T.tiles.precip}
                            value={fmt(cur.precipitation, 1)}
                            unit="mm"
                            sub={`${T.tiles.prob} ${fmt(nowHour.precipitation)}%`}
                            hint={T.hints.precip}
                            accent={C.precip}
                            spark={spark("precipitationSum")}
                            sparkNow={sparkNow}
                        />
                        <Tile
                            label={T.tiles.uv}
                            value={fmt(nowHour.uvIndex, 1)}
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
                            label={T.tiles.wbgt}
                            value={fmt(wbgt, 1)}
                            unit="°C"
                            tone={wbgtClass?.tone}
                            sub={wbgtClass ? T.wbgtLevels[wbgtClass.key] : "—"}
                            hint={T.hints.wbgt}
                            accent={C.temp}
                            gauge={frac(wbgt, 10, 35)}
                        />
                        <Tile
                            label={T.tiles.cape}
                            value={fmt(nowHour.cape)}
                            unit="J/kg"
                            tone={capeClass?.tone}
                            sub={capeClass ? T.capeLevels[capeClass.key] : "—"}
                            hint={T.hints.cape}
                            accent={C.cape}
                            gauge={frac(nowHour.cape, 0, 2500)}
                        />
                        <Tile
                            label={T.tiles.freezing}
                            value={fmt(nowHour.freezingLevel)}
                            unit="m"
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
                                series={[
                                    {
                                        key: "t",
                                        area: true,
                                        extrema: true,
                                        label: "T",
                                        color: C.temp,
                                        values: col("temperature"),
                                        unit: "°C",
                                    },
                                    {
                                        key: "f",
                                        label: "Feels",
                                        color: C.feels,
                                        values: col("feelsLike"),
                                        unit: "°C",
                                        dashed: true,
                                    },
                                    {
                                        key: "d",
                                        label: "Td",
                                        color: C.dew,
                                        values: col("dewPoint"),
                                        unit: "°C",
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
                                        dashed: true,
                                    },
                                ]}
                            />
                        </Card>
                        <Card title={T.charts.pressure}>
                            <TimeSeries
                                times={times}
                                nowIndex={chartNow}
                                nowLabel={T.now}
                                series={[
                                    {
                                        key: "p",
                                        area: true,
                                        extrema: true,
                                        label: "MSL",
                                        color: C.pressure,
                                        values: col("pressureMsl"),
                                        unit: "hPa",
                                        digits: 1,
                                    },
                                ]}
                            />
                        </Card>
                        <Card title={T.charts.wind}>
                            <TimeSeries
                                times={times}
                                nowIndex={chartNow}
                                nowLabel={T.now}
                                series={[
                                    {
                                        key: "w",
                                        area: true,
                                        label: "Wind",
                                        nonNegative: true,
                                        color: C.wind,
                                        values: col("windSpeed"),
                                        unit: "m/s",
                                        digits: 1,
                                    },
                                    {
                                        key: "g",
                                        label: "Gust",
                                        nonNegative: true,
                                        color: C.gust,
                                        values: col("windGust"),
                                        unit: "m/s",
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
                                rightDomain={[0, 100]}
                                series={[
                                    {
                                        key: "mm",
                                        label: "Precip",
                                        nonNegative: true,
                                        color: C.precip,
                                        kind: "bar",
                                        values: col("precipitationSum"),
                                        unit: "mm",
                                        digits: 1,
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
                                        <th>Hi/Lo °C</th>
                                        <th>Feels °C</th>
                                        <th>mm</th>
                                        <th>h</th>
                                        <th>Pop %</th>
                                        <th>Wind/Gust m/s</th>
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
                                                {fmt(d.high)} / {fmt(d.low)}
                                            </td>
                                            <td>
                                                {fmt(d.feelsLikeHigh)} / {fmt(d.feelsLikeLow)}
                                            </td>
                                            <td style={tint(d.precipitationSum, 0, 30, 210)}>
                                                {fmt(d.precipitationSum, 1)}
                                            </td>
                                            <td>{fmt(d.precipitationHours)}</td>
                                            <td style={tint(d.precipitation, 0, 100, 210)}>
                                                {fmt(d.precipitation)}
                                            </td>
                                            <td>
                                                {fmt(d.windSpeed, 1)} / {fmt(d.windGust, 1)}
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
                                        <th>P hPa</th>
                                        <th>Cld</th>
                                        <th>Vis km</th>
                                        <th>Wind</th>
                                        <th>Gust</th>
                                        <th>Dir</th>
                                        <th>mm</th>
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
                                                {fmt(h.temperature)}
                                            </td>
                                            <td>{fmt(h.feelsLike)}</td>
                                            <td>{fmt(h.dewPoint, 1)}</td>
                                            <td>{fmt(h.humidity)}</td>
                                            <td>{fmt(h.pressureMsl, 1)}</td>
                                            <td>{fmt(h.cloudCover)}</td>
                                            <td>
                                                {fmt(
                                                    Number.isFinite(h.visibility)
                                                        ? h.visibility / 1000
                                                        : null,
                                                    1,
                                                )}
                                            </td>
                                            <td>{fmt(h.windSpeed, 1)}</td>
                                            <td>{fmt(h.windGust, 1)}</td>
                                            <td>{toCardinal(h.windDirection)}</td>
                                            <td style={tint(h.precipitationSum, 0, 10, 210)}>
                                                {fmt(h.precipitationSum, 1)}
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
