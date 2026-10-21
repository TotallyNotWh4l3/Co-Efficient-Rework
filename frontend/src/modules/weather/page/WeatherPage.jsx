// ===================================================
// ファイル名: WeatherPage.jsx
// 作成日: 2026/10/21
// 概要: 独立した天気ページ（サイドバー「天気」セクション）
//       計器タイル・風/太陽・時系列チャート・7日間表・時間別生データ表を表示する。
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

function Tile({ label, value, unit, sub, tone, hint, children }) {
    return (
        <div className={`wxp-tile${tone ? ` wxp-tile--${tone}` : ""}`} title={hint}>
            <div className="wxp-tile__label">{label}</div>
            <div className="wxp-tile__value">
                {value}
                {unit && <span className="wxp-tile__unit">{unit}</span>}
            </div>
            {sub && <div className="wxp-tile__sub">{sub}</div>}
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

            {/* ---------- hero ---------- */}
            <section className="wxp-hero">
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

            {/* ---------- instruments ---------- */}
            <h3 className="wxp-section">{T.sections.instruments}</h3>
            <div className="wxp-tiles">
                <Tile
                    label={T.tiles.feelsLike}
                    value={fmt(cur.feelsLike)}
                    unit="°C"
                    sub={`Δ ${fmtSigned(cur.feelsLike - cur.temperature)}°`}
                    hint={T.hints.feelsLike}
                />
                <Tile
                    label={T.tiles.dewPoint}
                    value={fmt(td, 1)}
                    unit="°C"
                    sub={`${T.tiles.spread} ${fmt(spread, 1)}°`}
                    hint={T.hints.dewPoint}
                />
                <Tile
                    label={T.tiles.humidity}
                    value={fmt(cur.humidity)}
                    unit="%"
                    sub={`VPD ${fmt(vpd, 2)} kPa`}
                    hint={T.hints.humidity}
                />
                <Tile
                    label={T.tiles.wetBulb}
                    value={fmt(tw, 1)}
                    unit="°C"
                    sub={`T − Tw ${fmt(tw === null ? null : cur.temperature - tw, 1)}°`}
                    hint={T.hints.wetBulb}
                />
                <Tile
                    label={T.tiles.pressure}
                    value={fmt(cur.pressureMsl, 1)}
                    unit="hPa"
                    sub={
                        tendency ? (
                            <span className="wxp-tile__trend">
                                <TendencyIcon tendency={tendency} />
                                {T.tendency[tendency.key]} {fmtSigned(tendency.delta, 1)} hPa/3h
                            </span>
                        ) : (
                            `stn ${fmt(cur.surfacePressure, 1)}`
                        )
                    }
                    hint={T.hints.pressure}
                />
                <Tile
                    label={T.tiles.cloud}
                    value={fmt(cur.cloudCover)}
                    unit="%"
                    sub={cloudBase === null ? "—" : `${T.tiles.base} ≈ ${fmt(cloudBase)} m`}
                    hint={T.hints.cloud}
                />
                <Tile
                    label={T.tiles.visibility}
                    value={fmt(visKm, 1)}
                    unit="km"
                    sub={T.tiles.hourlyModel}
                    hint={T.hints.visibility}
                />
                <Tile
                    label={T.tiles.precip}
                    value={fmt(cur.precipitation, 1)}
                    unit="mm"
                    sub={`${T.tiles.prob} ${fmt(nowHour.precipitation)}%`}
                    hint={T.hints.precip}
                />
                <Tile
                    label={T.tiles.uv}
                    value={fmt(nowHour.uvIndex, 1)}
                    tone={uvClass?.tone}
                    sub={
                        uvClass ? `${T.uvLevels[uvClass.key]} · max ${fmt(today.uvIndex, 1)}` : "—"
                    }
                    hint={T.hints.uv}
                />
                <Tile
                    label={T.tiles.wbgt}
                    value={fmt(wbgt, 1)}
                    unit="°C"
                    tone={wbgtClass?.tone}
                    sub={wbgtClass ? T.wbgtLevels[wbgtClass.key] : "—"}
                    hint={T.hints.wbgt}
                />
                <Tile
                    label={T.tiles.cape}
                    value={fmt(nowHour.cape)}
                    unit="J/kg"
                    tone={capeClass?.tone}
                    sub={capeClass ? T.capeLevels[capeClass.key] : "—"}
                    hint={T.hints.cape}
                />
                <Tile
                    label={T.tiles.freezing}
                    value={fmt(nowHour.freezingLevel)}
                    unit="m"
                    sub="0 °C isotherm"
                    hint={T.hints.freezing}
                />
            </div>

            {/* ---------- wind + sun ---------- */}
            <h3 className="wxp-section">{T.sections.windSun}</h3>
            <div className="wxp-pair">
                <Card title={T.wind.title}>
                    <div className="wxp-windcard">
                        <Compass degrees={cur.windDirection} speed={cur.windSpeed} />
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
                                    {force === null ? "--" : `${force} · ${T.wind.names[force]}`}
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
                                    {toCardinal(today.windDirection)} {fmt(today.windDirection)}°
                                </dd>
                            </div>
                        </dl>
                    </div>
                </Card>

                <Card title={T.sun.title}>
                    <div className="wxp-suncard">
                        <SunArc sunrise={today.sunrise} sunset={today.sunset} now={cur.time} />
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
                </Card>
            </div>

            {/* ---------- trends ---------- */}
            <h3 className="wxp-section">{T.sections.trends}</h3>
            <div className="wxp-charts">
                <Card title={T.charts.temperature}>
                    <TimeSeries
                        times={times}
                        nowIndex={chartNow}
                        nowLabel={T.now}
                        series={[
                            {
                                key: "t",
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
                                label: "Wind",
                                color: C.wind,
                                values: col("windSpeed"),
                                unit: "m/s",
                                digits: 1,
                            },
                            {
                                key: "g",
                                label: "Gust",
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
                                color: C.precip,
                                kind: "bar",
                                values: col("precipitationSum"),
                                unit: "mm",
                                digits: 1,
                            },
                            {
                                key: "pp",
                                label: "Prob",
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
                                label: "UV",
                                color: C.uv,
                                values: col("uvIndex"),
                                digits: 1,
                            },
                            {
                                key: "cape",
                                label: "CAPE",
                                color: C.cape,
                                axis: "right",
                                values: col("cape"),
                                unit: "J/kg",
                            },
                        ]}
                    />
                </Card>
            </div>

            {/* ---------- 7-day table ---------- */}
            <h3 className="wxp-section">{T.sections.week}</h3>
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
                                <td>
                                    {fmt(d.high)} / {fmt(d.low)}
                                </td>
                                <td>
                                    {fmt(d.feelsLikeHigh)} / {fmt(d.feelsLikeLow)}
                                </td>
                                <td>{fmt(d.precipitationSum, 1)}</td>
                                <td>{fmt(d.precipitationHours)}</td>
                                <td>{fmt(d.precipitation)}</td>
                                <td>
                                    {fmt(d.windSpeed, 1)} / {fmt(d.windGust, 1)}
                                </td>
                                <td>{toCardinal(d.windDirection)}</td>
                                <td>{fmt(d.uvIndex, 1)}</td>
                                <td>{hhmm(d.sunrise)}</td>
                                <td>{hhmm(d.sunset)}</td>
                                <td>{formatDuration(d.daylightDuration)}</td>
                                <td>{formatDuration(d.sunshineDuration)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ---------- raw hourly ---------- */}
            <h3 className="wxp-section">{T.sections.raw}</h3>
            <div className="wxp-tablewrap wxp-tablewrap--raw">
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
                                <td>{fmt(h.temperature)}</td>
                                <td>{fmt(h.feelsLike)}</td>
                                <td>{fmt(h.dewPoint, 1)}</td>
                                <td>{fmt(h.humidity)}</td>
                                <td>{fmt(h.pressureMsl, 1)}</td>
                                <td>{fmt(h.cloudCover)}</td>
                                <td>
                                    {fmt(
                                        Number.isFinite(h.visibility) ? h.visibility / 1000 : null,
                                        1,
                                    )}
                                </td>
                                <td>{fmt(h.windSpeed, 1)}</td>
                                <td>{fmt(h.windGust, 1)}</td>
                                <td>{toCardinal(h.windDirection)}</td>
                                <td>{fmt(h.precipitationSum, 1)}</td>
                                <td>{fmt(h.precipitation)}</td>
                                <td>{fmt(h.uvIndex, 1)}</td>
                                <td>{fmt(h.cape)}</td>
                                <td>{fmt(h.shortwaveRadiation)}</td>
                                <td>{h.weatherCode}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
