// ===================================================
// ファイル名: ModuleSpecificSettings.jsx
// 概要: ダッシュボード上の各モジュール固有の設定をまとめて編集する。
//       値は module.settings に保存され、モジュール本体はそこから読み取る。
// ===================================================

import "./module-specific-settings.css";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

import { useDashboard } from "../../dashboard/useDashboard";
import { useLanguage } from "../useLanguage";
import { useSettings } from "../useSettings";
import { useLocation } from "../../locations/useLocation";
import useTransit from "../../transit/useTransit";

// ---------------------------------------------------
// Small building blocks
// ---------------------------------------------------

function Group({ label, children }) {
    return (
        <div className="mss__group">
            {label && <span className="mss__group-label">{label}</span>}
            {children}
        </div>
    );
}

// options: [{ value, label, description? }]
function Choice({ options, value, onChange }) {
    return (
        <div className="mss__choices">
            {options.map((o) => (
                <button
                    key={o.value}
                    type="button"
                    className={`mss__choice${o.value === value ? " mss__choice--on" : ""}`}
                    aria-pressed={o.value === value}
                    onClick={() => o.value !== value && onChange(o.value)}
                >
                    <span className="mss__choice-name">{o.label}</span>
                    {o.description && <span className="mss__choice-desc">{o.description}</span>}
                </button>
            ))}
        </div>
    );
}

function Toggle({ label, checked, onChange }) {
    return (
        <label className="mss__toggle">
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <span>{label}</span>
        </label>
    );
}

// Range input that only saves when the user lets go, so dragging the slider
// doesn't send a request per step.
function CommitSlider({ value, min, max, onCommit }) {
    const [draft, setDraft] = useState(value);
    useEffect(() => setDraft(value), [value]);

    const commit = () => draft !== value && onCommit(draft);

    return (
        <input
            type="range"
            className="mss__slider"
            min={min}
            max={max}
            value={draft}
            onChange={(e) => setDraft(parseInt(e.target.value, 10))}
            onPointerUp={commit}
            onKeyUp={commit}
            onBlur={commit}
        />
    );
}

// ---------------------------------------------------
// One form per module type
// ---------------------------------------------------

function ClockForm({ module }) {
    const { updateModuleSettings } = useDashboard();
    const lang = useLanguage();
    const t = lang.modules.clock.options;
    const s = module.settings ?? {};
    const set = (key) => (value) => updateModuleSettings(module.id, key, value);

    return (
        <Group>
            <Toggle label={t.hour12} checked={s.hour12 === true} onChange={set("hour12")} />
            <Toggle label={t.showSeconds} checked={s.showSeconds !== false} onChange={set("showSeconds")} />
            <Toggle label={t.showDate} checked={s.showDate !== false} onChange={set("showDate")} />
        </Group>
    );
}

const WEATHER_VIEWS = ["combined", "current", "forecast"];
const DEFAULT_SCHOOL_START = "08:30";
const DEFAULT_SCHOOL_END = "15:30";

function WeatherForm({ module, copy }) {
    const { updateModuleSettings, ensureModuleMinSize } = useDashboard();
    const { locationOptions } = useLocation();
    const { settings } = useSettings();
    const lang = useLanguage();
    const t = lang.modules.weather.settings;
    const s = module.settings ?? {};

    const location = s.location ?? settings?.preferences?.locationId ?? "";
    const view = WEATHER_VIEWS.includes(s.view) ? s.view : "combined";

    return (
        <>
            <Group label={copy.location}>
                <select
                    className="mss__select"
                    value={location}
                    onChange={(e) => updateModuleSettings(module.id, "location", e.target.value)}
                >
                    {locationOptions.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                            {loc.label}
                        </option>
                    ))}
                </select>
            </Group>

            <Group label={t.layout.title}>
                <Choice
                    value={view}
                    options={WEATHER_VIEWS.map((v) => ({
                        value: v,
                        label: t.layout[v].title,
                        description: t.layout[v].description,
                    }))}
                    onChange={(v) => {
                        updateModuleSettings(module.id, "view", v);
                        ensureModuleMinSize(module.id, v);
                    }}
                />
            </Group>

            <Group label={t.schoolHours.title}>
                <div className="mss__row">
                    <label className="mss__field">
                        <span>{t.schoolHours.start}</span>
                        <input
                            type="time"
                            value={s.schoolStart ?? DEFAULT_SCHOOL_START}
                            onChange={(e) => updateModuleSettings(module.id, "schoolStart", e.target.value)}
                        />
                    </label>
                    <label className="mss__field">
                        <span>{t.schoolHours.end}</span>
                        <input
                            type="time"
                            value={s.schoolEnd ?? DEFAULT_SCHOOL_END}
                            onChange={(e) => updateModuleSettings(module.id, "schoolEnd", e.target.value)}
                        />
                    </label>
                </div>
            </Group>
        </>
    );
}

function ScheduleForm({ module }) {
    const { updateModuleSettings, ensureModuleMinSize } = useDashboard();
    const lang = useLanguage();
    const t = lang.modules.schedule.settings;
    const rt = lang.modules.schedule.relative;
    const s = module.settings ?? {};
    const set = (key) => (value) => updateModuleSettings(module.id, key, value);

    const viewMode = s.viewMode === "relative" ? "relative" : "absolute";
    const layout = s.layout === "week" ? "week" : "month";
    const orientation = s.weekOrientation === "horizontal" ? "horizontal" : "vertical";
    const totalDays = layout === "week" ? 7 : 30;
    const daysBefore = Math.min(totalDays, Math.max(0, Math.round(Number(s.daysBefore) || 0)));
    const daysAhead = totalDays - daysBefore;

    const windowHint = rt.windowHint
        .replace("{before}", daysBefore)
        .replace("{beforePlural}", daysBefore === 1 ? "" : "s")
        .replace("{after}", daysAhead)
        .replace("{afterPlural}", daysAhead === 1 ? "" : "s")
        .replace("{total}", totalDays);

    const opts = (group, values) =>
        values.map((v) => ({ value: v, label: group[v].title, description: group[v].description }));

    return (
        <>
            <Group label={t.viewMode.title}>
                <Choice
                    value={viewMode}
                    options={opts(t.viewMode, ["absolute", "relative"])}
                    onChange={set("viewMode")}
                />
                {viewMode === "relative" && (
                    <div className="mss__sub">
                        <p className="mss__hint">{windowHint}</p>
                        <span className="mss__group-label">
                            {rt.daysBeforeLabel} {daysBefore}
                        </span>
                        <CommitSlider value={daysBefore} min={0} max={totalDays} onCommit={set("daysBefore")} />
                        <button
                            type="button"
                            className="mss__btn"
                            onClick={() => set("daysBefore")(0)}
                        >
                            {rt.reset}
                        </button>
                    </div>
                )}
            </Group>

            <Group label={t.layout.title}>
                <Choice
                    value={layout}
                    options={opts(t.layout, ["month", "week"])}
                    onChange={(v) => {
                        set("layout")(v);
                        ensureModuleMinSize(module.id, v);
                    }}
                />
                {layout === "week" && (
                    <div className="mss__sub">
                        <span className="mss__group-label">{t.orientation.title}</span>
                        <Choice
                            value={orientation}
                            options={opts(t.orientation, ["horizontal", "vertical"])}
                            onChange={set("weekOrientation")}
                        />
                    </div>
                )}
            </Group>
        </>
    );
}

const TRANSIT_LINE_OPTIONS = [
    { key: "orientation", values: ["horizontal", "vertical"], fallback: "horizontal" },
    { key: "colorMode", values: ["mono", "theme"], fallback: "mono" },
    { key: "timer", values: ["seconds", "minutes"], fallback: "seconds" },
];

function TransitForm({ module, copy }) {
    const { updateModuleSettings, ensureModuleMinSize } = useDashboard();
    const lang = useLanguage();
    const t = lang.modules.transit;
    const s = module.settings ?? {};
    const stopId = s.stopId ?? null;
    const view = s.view === "line" ? "line" : "board";

    const { stops, stop, isLoading } = useTransit(stopId);

    const direction = stop?.directions.find((d) => d.id === s.directionId) ?? stop?.directions[0];

    return (
        <>
            <Group label={copy.station}>
                {!isLoading && stops.length === 0 ? (
                    <p className="mss__hint">{t.noStops}</p>
                ) : (
                    <select
                        className="mss__select"
                        value={stopId ?? ""}
                        onChange={(e) => updateModuleSettings(module.id, "stopId", e.target.value)}
                    >
                        {!stopId && <option value="">{t.selectStop}</option>}
                        {stops.map((st) => (
                            <option key={st.id} value={st.id}>
                                {st.name}
                            </option>
                        ))}
                    </select>
                )}
            </Group>

            {stop && stop.directions.length > 1 && (
                <Group label={copy.direction}>
                    <Choice
                        value={direction?.id}
                        options={stop.directions.map((d) => ({ value: d.id, label: d.label }))}
                        onChange={(v) => updateModuleSettings(module.id, "directionId", v)}
                    />
                </Group>
            )}

            <Group label={copy.display}>
                <Choice
                    value={view}
                    options={[
                        { value: "board", label: copy.views.board },
                        { value: "line", label: copy.views.line },
                    ]}
                    onChange={(v) => {
                        updateModuleSettings(module.id, "view", v);
                        ensureModuleMinSize(module.id, v);
                    }}
                />
            </Group>

            {view === "line" &&
                TRANSIT_LINE_OPTIONS.map(({ key, values, fallback }) => (
                    <Group key={key} label={t.options[key].label}>
                        <Choice
                            value={values.includes(s[key]) ? s[key] : fallback}
                            options={values.map((v) => ({ value: v, label: t.options[key][v] }))}
                            onChange={(v) => updateModuleSettings(module.id, key, v)}
                        />
                    </Group>
                ))}
        </>
    );
}

function AnnouncementForm({ module, copy }) {
    const { updateModuleSettings, ensureModuleMinSize } = useDashboard();
    const lang = useLanguage();
    const t = lang.modules.announcement.header;
    const view = module.settings?.view === "extended" ? "extended" : "compact";

    return (
        <Group label={copy.display}>
            <Choice
                value={view}
                options={[
                    { value: "compact", label: t.compactView },
                    { value: "extended", label: t.extendView },
                ]}
                onChange={(v) => {
                    updateModuleSettings(module.id, "view", v);
                    ensureModuleMinSize(module.id, v);
                }}
            />
        </Group>
    );
}

const FORMS = {
    clock: ClockForm,
    weather: WeatherForm,
    schedule: ScheduleForm,
    transit: TransitForm,
    announcement: AnnouncementForm,
};

// ---------------------------------------------------
// The list
// ---------------------------------------------------

export default function ModuleSpecificSettings({ modules, labelFor, copy = {} }) {
    const [openId, setOpenId] = useState(null);

    if (modules.length === 0) {
        return <p className="mss__hint">{copy.empty}</p>;
    }

    // Number modules that share a name ("Weather #1", "Weather #2").
    const names = modules.map(labelFor);
    const seen = {};
    const labels = names.map((name) => {
        const total = names.filter((n) => n === name).length;
        seen[name] = (seen[name] ?? 0) + 1;
        return total > 1 ? `${name} #${seen[name]}` : name;
    });

    return (
        <div className="mss">
            {modules.map((module, i) => {
                const Form = FORMS[module.type];
                const isOpen = openId === module.id;

                return (
                    <div key={module.id} className={`mss__card${isOpen ? " mss__card--open" : ""}`}>
                        <button
                            type="button"
                            className="mss__card-head"
                            aria-expanded={isOpen}
                            onClick={() => setOpenId(isOpen ? null : module.id)}
                        >
                            <span className="mss__card-title">{labels[i]}</span>
                            <ChevronDown className="mss__card-chevron" size={16} />
                        </button>

                        {isOpen && (
                            <div className="mss__card-body">
                                {Form ? (
                                    <Form module={module} copy={copy} />
                                ) : (
                                    <p className="mss__hint">{copy.noOptions}</p>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
