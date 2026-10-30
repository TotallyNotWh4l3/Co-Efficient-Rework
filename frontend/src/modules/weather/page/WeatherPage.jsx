// ===================================================
// ファイル名: WeatherPage.jsx
// 作成日: 2026/10/21
// 概要: 独立した天気ページ（サイドバー「天気」セクション）
//       計器タイル・風/太陽(+月)・時系列チャート・7日間表・時間別生データ表を
//       ページ全体のスクロール無しで一画面に収めて表示する。
//       データは既存の useWeather / GET /weather をそのまま利用する。
// ===================================================

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, MapPin, Bell, X } from "lucide-react";

import useWeather from "../useWeather";
import { useLocation } from "../../locations/useLocation";
import { useSettings } from "../../settings/useSettings";
import { useLanguage } from "../../settings/useLanguage";

import CollapsibleHeader from "../../../common/ModuleHost/CollapsibleHeader";
import Compass from "../components/Compass";
import SunArc from "../components/SunArc";
import Sparkline from "../components/Sparkline";
import TileDetail from "../components/TileDetail";
import TileModule from "../components/TileModule";
import CardModule from "../components/CardModule";
import Card from "../components/WxCard";
import AlertPanel from "../components/AlertPanel";
import MoonPhase from "../components/MoonPhase";
import CountUp from "../components/CountUp";
import usePersistentState from "../utils/usePersistentState";
import buildMetrics from "../metrics/buildMetrics";
import useWeatherLayout from "../layout/useWeatherLayout";
import useMediaQuery from "../layout/useMediaQuery";
import WeatherGrid from "../layout/WeatherGrid";
import WeatherEditControls from "../layout/WeatherEditControls";
import ModuleSettingsPanel from "../layout/ModuleSettingsPanel";
import { makeUnits, conv, WIND_UNITS, DEFAULT_UNITS } from "../utils/units";
import { ALERT_METRICS, DEFAULT_RULES, evaluateAlerts } from "../utils/alerts";
import {
    fmt,
    fmtSigned,
    frac,
    hhmm,
    localMs,
    formatDuration,
    formatCoord,
    toCardinal,
    beaufort,
    findNowIndex,
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
import "../layout/weather-layout.css";

const RANGES = [
    { id: "h24", hours: 24 },
    { id: "h48", hours: 48 },
    { id: "h72", hours: 72 },
    { id: "d7", hours: 168 },
];

// The charts always receive this many hours; the range buttons only change how
// much of it is in view (TimeSeries `viewCount`), so switching ranges pans/zooms
// smoothly instead of the data outside the new range disappearing.
const MAX_HOURS = Math.max(...RANGES.map((r) => r.hours));

// Windows shorter than this start with the page header folded away.
const SHORT_WINDOW_PX = 820;

// How many hours of already-elapsed context to show before "now".
const LOOKBACK_HOURS = 3;

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

    // Module layout (position / size / what each tile and card shows), saved per
    // user in settings.preferences.weatherLayout. Edit mode is a view state only.
    const saveLayout = useCallback(
        (value) => updatePreference("weatherLayout", value),
        [updatePreference],
    );
    const { layout, move, resize, configure, remove, add, reset } = useWeatherLayout(
        settings?.preferences?.weatherLayout,
        saveLayout,
    );
    const [editing, setEditing] = useState(false);
    const [panel, setPanel] = useState(null); // { id, anchor: DOMRect } — settings panel
    // Narrow windows use the stacked (non-grid) layout, which can't be edited.
    const narrow = useMediaQuery("(max-width: 1100px)");
    const editActive = editing && !narrow;
    const toggleEditing = () => {
        setEditing(!editing);
        setPanel(null);
    };
    const [expanded, setExpanded] = useState(null);
    const [alertOpen, setAlertOpen] = useState(false);
    const [celestialOpen, setCelestialOpen] = useState(false);
    useEffect(() => {
        if (!celestialOpen) return undefined;
        const onKey = (e) => e.key === "Escape" && setCelestialOpen(false);
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [celestialOpen]);
    // The header can be folded away to give the one-screen layout more height.
    // Short windows start with it folded; after that the user's choice is kept.
    const [headerOpen, setHeaderOpen] = usePersistentState(
        "wxp-header-open-v2",
        window.innerHeight >= SHORT_WINDOW_PX,
    );
    const U = makeUnits(unitPrefs);

    // Resolve a starting location once the list is known. Until then the
    // backend falls back to the user's default location on its own.
    useEffect(() => {
        if (locationId || locationOptions.length === 0) return;
        setLocationId(settings?.preferences?.locationId ?? locationOptions[0].id);
    }, [locationId, locationOptions, settings?.preferences?.locationId]);

    const { weather, loading, error, refresh } = useWeather(locationId ?? undefined);

    const renderHeader = (alertCount = 0, withEdit = false) => (
        // While editing, the header stays open: it holds Done / Add / Reset.
        <CollapsibleHeader
            collapsed={!headerOpen && !editActive}
            onToggle={() => setHeaderOpen(!headerOpen)}
        >
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
                                    setUnitPrefs({
                                        system: sys,
                                        wind: sys === "metric" ? "ms" : "mph",
                                    })
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

                    {withEdit && (
                        <WeatherEditControls
                            T={T}
                            editing={editActive}
                            canEdit={!narrow}
                            present={new Set(layout.items.map((i) => i.id))}
                            onToggle={toggleEditing}
                            onAdd={add}
                            onReset={() => {
                                reset();
                                setPanel(null);
                            }}
                        />
                    )}
                </div>
            </header>
        </CollapsibleHeader>
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
    const today = daily[0] ?? {};
    const tomorrow = daily[1] ?? {};

    // 25 h window (12 h back, 12 h ahead) behind each tile's sparkline.
    const sparkStart = Math.max(0, nowIdx - 12);
    const sparkWin = hourly.slice(sparkStart, nowIdx + 13);
    const sparkNow = nowIdx - sparkStart;
    const heat = heatHue(cur.temperature);
    const tc = (v) => conv(U.temp, v);

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
    const col = (key, u) =>
        win.map((h) => (Number.isFinite(h[key]) ? (u ? u.f(h[key]) : h[key]) : null));
    const chartNow = nowIdx - start;

    // The chart cards always receive this many hours; the range buttons only
    // change how much of it is in view (TimeSeries `viewCount`), so switching
    // ranges pans/zooms smoothly instead of the data outside the range vanishing.
    const fullWin = hourly.slice(start, start + MAX_HOURS);
    const viewCount = Math.min(hours, fullWin.length);

    // ---------- alerts ----------
    const alerts = evaluateAlerts(rules, hourly, nowIdx);
    const nowHits = new Set(alerts.filter((a) => a.nowHit).map((a) => a.rule.metric));
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

    // ---------- instrument metrics: tiles, chart cards and tile detail charts ----------
    const { metrics, chart } = buildMetrics({
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
    });

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

    // The single-instance modules (no options yet). Each one fills its grid cell.
    const fixed = {
        hero: (
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
        ),
        alerts: (
            <section className="wxp-alertrow" role={alerts.length > 0 ? "alert" : undefined}>
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
        ),
        outlook: (
            <Card title={T.outlook.title} className="wxp-card--outlook wxp-card--half">
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
                            {rainChange ? clock(rainChange) : wetNow ? ">24 h" : T.outlook.dryValue}
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
        ),
        wind: (
            <Card title={T.wind.title} className="wxp-card--wind wxp-card--half">
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
                                {toCardinal(cur.windDirection)} {fmt(cur.windDirection)}°
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
                            <dd>{gustFactor === null ? "--" : `×${fmt(gustFactor, 2)}`}</dd>
                        </div>
                        <div>
                            <dt>{T.wind.beaufort}</dt>
                            <dd>{force === null ? "--" : `${force} · ${T.wind.names[force]}`}</dd>
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
                                {toCardinal(today.windDirection)} {fmt(today.windDirection)}°
                            </dd>
                        </div>
                    </dl>
                </div>
            </Card>
        ),
        sun: (
            <Card title={`${T.sun.title} / ${T.moon.title}`} onOpen={() => setCelestialOpen(true)}>
                <div className="wxp-celestial has-moon">
                    <div className="wxp-body">
                        <SunArc sunrise={today.sunrise} sunset={today.sunset} now={cur.time} />
                        <dl className="wxp-kv">
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
                                <dt>{T.moon.phase}</dt>
                                <dd>{moonKey ? T.moon.names[moonKey] : "--"}</dd>
                            </div>
                            <div>
                                <dt>{T.moon.illumination}</dt>
                                <dd>{illum === null ? "--" : `${fmt(illum * 100)}%`}</dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </Card>
        ),
        week: (
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
                                        {fmt(tc(d.feelsLikeHigh))} / {fmt(tc(d.feelsLikeLow))}
                                    </td>
                                    <td style={tint(d.precipitationSum, 0, 30, 210)}>
                                        {fmt(conv(U.precip, d.precipitationSum), U.precip.digits)}
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
                                    <td style={tint(d.uvIndex, 0, 11, 330)}>{fmt(d.uvIndex, 1)}</td>
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
        ),
        hourly: (
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
                                        {fmt(conv(U.pressure, h.pressureMsl), U.pressure.digits)}
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
                                        {fmt(conv(U.precip, h.precipitationSum), U.precip.digits)}
                                    </td>
                                    <td style={tint(h.precipitation, 0, 100, 210)}>
                                        {fmt(h.precipitation)}
                                    </td>
                                    <td style={tint(h.uvIndex, 0, 11, 330)}>{fmt(h.uvIndex, 1)}</td>
                                    <td style={tint(h.cape, 0, 2500, 0)}>{fmt(h.cape)}</td>
                                    <td>{fmt(h.shortwaveRadiation)}</td>
                                    <td>{h.weatherCode}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        ),
    };

    const renderModule = (item) => {
        switch (item.type) {
            case "tile":
                return (
                    <TileModule
                        metric={metrics[item.config.metric]}
                        display={item.config.display}
                        onOpen={setExpanded}
                    />
                );
            case "card":
                return <CardModule config={item.config} metrics={metrics} chart={chart} />;
            default:
                return fixed[item.type] ?? null;
        }
    };

    const panelItem = panel ? layout.items.find((i) => i.id === panel.id) : null;
    const edit = {
        labelFor: (item) => T.edit.modules[item.type],
        activeId: panelItem?.id ?? null,
        onMove: move,
        onResize: resize,
        onRemove: (id) => {
            remove(id);
            setPanel(null);
        },
        onOpen: (id, el) => setPanel({ id, anchor: el.getBoundingClientRect() }),
        copy: T.edit,
    };

    return (
        <div className="wxp">
            {renderHeader(alerts.length, true)}

            {expanded && metrics[expanded] && (
                <TileDetail
                    detail={metrics[expanded].detail}
                    T={T.detail}
                    onClose={() => setExpanded(null)}
                />
            )}
            {celestialOpen && (
                <div
                    className="wxp-modal"
                    onClick={() => setCelestialOpen(false)}
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className="wxp-modal__box wxp-celestialpanel"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <header className="wxp-modal__head">
                            <h3>{`${T.sun.title} / ${T.moon.title}`}</h3>
                            <button
                                className="wxp-icon-btn"
                                onClick={() => setCelestialOpen(false)}
                                aria-label={T.detail.close}
                            >
                                <X size={14} />
                            </button>
                        </header>
                        <div className="wxp-modal__now">
                            {formatDuration(daylightSec)}
                            <span>{T.sun.daylight}</span>
                        </div>
                        <p className="wxp-modal__hint">
                            {[
                                moonKey ? T.moon.names[moonKey] : null,
                                illum === null ? null : `${fmt(illum * 100)}%`,
                            ]
                                .filter(Boolean)
                                .join(" · ")}
                        </p>
                        <h4 className="wxp-celestialpanel__sub">{T.sun.title}</h4>
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
                                <dt>{T.sun.sunshine}</dt>
                                <dd>{formatDuration(today.sunshineDuration)}</dd>
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
                        <h4 className="wxp-celestialpanel__sub">{T.moon.title}</h4>
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
                                              (localMs(moon.set) - localMs(moon.rise)) / 1000,
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

            <WeatherGrid
                layout={layout}
                editing={editActive}
                renderModule={renderModule}
                edit={edit}
            />

            {editActive && panelItem && (
                <ModuleSettingsPanel
                    key={panelItem.id}
                    item={panelItem}
                    anchor={panel.anchor}
                    T={T}
                    onChange={(config) => configure(panelItem.id, config)}
                    onClose={() => setPanel(null)}
                />
            )}
        </div>
    );
}
