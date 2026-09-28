// ===================================================
// ファイル名: ModuleSettings.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: モジュール設定ページ コンポーネント
// ===================================================

import "./module-settings.css";

import { useState, useEffect } from "react";
import { Blocks, Plus, Trash2 } from "lucide-react";

import { useDashboard } from "../../dashboard/useDashboard";
import { useSettings } from "../useSettings";
import { useLanguage } from "../useLanguage";

import Settings from "../components/SettingsComponents";
import ModulePositionPreview from "../components/ModulePositionPreview";

// A module's cell-span is entered as a width and height (in grid cells)
// rather than picked from a fixed set of buttons, so any size the grid can
// hold is available. Values are clamped to 1..columns / 1..rows on commit
// (blur or Enter), which lets the user type freely without the field
// fighting them mid-edit.
function SizeField({ label, value, min, max, onCommit, disabled }) {
    const [draft, setDraft] = useState(String(value));

    // Keep the field in step when the size changes from elsewhere (SSE
    // sync from another tab, or a view change auto-growing the module).
    useEffect(() => {
        setDraft(String(value));
    }, [value]);

    const commit = () => {
        const parsed = Math.round(Number(draft));
        const next = Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : value;
        setDraft(String(next));
        if (next !== value) onCommit(next);
    };

    return (
        <label className="module-settings__size-field">
            <span className="module-settings__size-field-label">{label}</span>
            <input
                type="number"
                className="module-settings__size-input"
                min={min}
                max={max}
                step={1}
                value={draft}
                disabled={disabled}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                }}
            />
        </label>
    );
}

function SizeInputs({ value, onChange, maxW, maxH, labels, disabled }) {
    const w = value?.w ?? 1;
    const h = value?.h ?? 1;

    return (
        <div className="module-settings__size-inputs">
            <SizeField
                label={labels?.width ?? "Width"}
                value={w}
                min={1}
                max={maxW}
                disabled={disabled}
                onCommit={(nextW) => onChange({ w: nextW, h })}
            />
            <span className="module-settings__size-times">×</span>
            <SizeField
                label={labels?.height ?? "Height"}
                value={h}
                min={1}
                max={maxH}
                disabled={disabled}
                onCommit={(nextH) => onChange({ w, h: nextH })}
            />
        </div>
    );
}

export default function ModuleSettings() {
    const { dashboard, addModule, removeModule, updateModuleLayout, moveModule } = useDashboard();
    const { settings, loading } = useSettings();
    const [pendingSpan, setPendingSpan] = useState({ w: 1, h: 1 });

    const T = useLanguage();
    const copy = T?.settings?.modules ?? {};
    const sizeCopy = copy.size ?? {};
    const positionCopy = copy.position ?? {};
    const maxW = dashboard.layout?.columns ?? 3;
    const maxH = dashboard.layout?.rows ?? 4;

    // Mirrors ModuleManager.jsx's list — kept here too since this page owns
    // the "add module" UI now. If you add a new module type, add it in both
    // places (and in ModuleRenderer.jsx's MODULE_COMPONENTS map, plus a
    // settings.modules.<type>.title key in en.js/ja.js), or it won't render
    // or won't have a translated name.
    const AVAILABLE_MODULES = [
        { type: "weather", name: copy.weather?.title ?? "Weather" },
        { type: "schedule", name: copy.schedule?.title ?? "Schedule" },
        { type: "announcement", name: copy.announcements?.title ?? "Announcements" },
    ];

    if (loading) {
        return <div className="module-settings">Loading settings...</div>;
    }

    if (!settings) {
        return <div className="module-settings">Unable to load settings.</div>;
    }

    const activeModules = dashboard.modules ?? [];
    const activeTypeCounts = activeModules.reduce((counts, module) => {
        counts[module.type] = (counts[module.type] ?? 0) + 1;
        return counts;
    }, {});

    return (
        <div className="module-settings">
            <Settings.Title Icon={Blocks}>{copy.title ?? "Modules"}</Settings.Title>

            <Settings.Description>
                {copy.description ?? "Add or remove modules from your dashboard."}
            </Settings.Description>

            <Settings.Divider mod="thick" />

            {/* =======================
                AVAILABLE MODULES
            ======================== */}

            <Settings.Section>
                <Settings.SectionTitle>{copy.available ?? "Add a Module"}</Settings.SectionTitle>

                <Settings.Description>
                    {copy.availableDescription ?? "Pick a module to add it to your dashboard."}
                </Settings.Description>

                <span className="module-settings__span-label">{sizeCopy.label ?? "Cell size"}</span>
                <SizeInputs
                    value={pendingSpan}
                    onChange={setPendingSpan}
                    maxW={maxW}
                    maxH={maxH}
                    labels={sizeCopy}
                />

                <div className="module-settings__grid">
                    {AVAILABLE_MODULES.map((module) => (
                        <button
                            key={module.type}
                            type="button"
                            className="module-settings__add-card"
                            onClick={() =>
                                addModule(
                                    module.type,
                                    settings.moduleDefaults?.[module.type] ?? {},
                                    { w: pendingSpan.w, h: pendingSpan.h },
                                )
                            }
                        >
                            <span className="module-settings__add-name">{module.name}</span>
                            <span className="module-settings__add-icon">
                                <Plus size={16} />
                            </span>
                        </button>
                    ))}
                </div>
            </Settings.Section>

            <Settings.Divider />

            {/* =======================
                POSITION PREVIEW
            ======================== */}

            <Settings.Section>
                <Settings.SectionTitle>{positionCopy.title ?? "Position"}</Settings.SectionTitle>

                <Settings.Description>
                    {positionCopy.description ??
                        "A miniature of your dashboard grid. Move modules around to change where they sit."}
                </Settings.Description>

                <ModulePositionPreview
                    layout={dashboard.layout}
                    modules={dashboard.modules ?? []}
                    labelFor={(module) =>
                        module.settings?.title ||
                        AVAILABLE_MODULES.find((m) => m.type === module.type)?.name ||
                        module.type
                    }
                    onMove={moveModule}
                    copy={positionCopy}
                />
            </Settings.Section>

            <Settings.Divider />

            {/* =======================
                CURRENT MODULES
            ======================== */}

            <Settings.Section>
                <Settings.SectionTitle>{copy.current ?? "Current Modules"}</Settings.SectionTitle>

                <Settings.Description>
                    {copy.currentDescription ?? "Modules currently on your dashboard."}
                </Settings.Description>

                {activeModules.length === 0 ? (
                    <p className="module-settings__empty">
                        {copy.empty ?? "No modules added yet — pick one above to get started."}
                    </p>
                ) : (
                    <ul className="module-settings__list">
                        {activeModules.map((module) => {
                            const meta = AVAILABLE_MODULES.find((m) => m.type === module.type);
                            const label = meta?.name ?? module.type;
                            const count = activeTypeCounts[module.type];

                            return (
                                <li
                                    key={module.id}
                                    className="module-settings__list-item module-settings__list-item--stacked"
                                >
                                    <div className="module-settings__list-row">
                                        <span className="module-settings__list-label">
                                            {module.settings?.title || label}
                                            {count > 1 && (
                                                <span className="module-settings__list-type">
                                                    {" "}
                                                    ({label})
                                                </span>
                                            )}
                                        </span>

                                        <button
                                            type="button"
                                            className="module-settings__remove-btn"
                                            onClick={() => removeModule(module.id)}
                                            title={copy.remove ?? "Remove"}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    <SizeInputs
                                        value={module.layout}
                                        maxW={maxW}
                                        maxH={maxH}
                                        onChange={(span) =>
                                            updateModuleLayout(module.id, {
                                                w: span.w,
                                                h: span.h,
                                            })
                                        }
                                        labels={sizeCopy}
                                    />
                                </li>
                            );
                        })}
                    </ul>
                )}
            </Settings.Section>
        </div>
    );
}
