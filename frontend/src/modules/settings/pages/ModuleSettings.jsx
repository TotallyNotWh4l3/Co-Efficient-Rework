// ===================================================
// ファイル名: ModuleSettings.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: モジュール設定ページ コンポーネント
// ===================================================

import "./module-settings.css";

import { useState } from "react";
import { Blocks, Plus, Trash2 } from "lucide-react";

import { useDashboard } from "../../dashboard/useDashboard";
import { useSettings } from "../useSettings";
import { useLanguage } from "../useLanguage";

import Settings from "../components/SettingsComponents";

// A module's cell-span is picked from a fixed set of sizes rather than
// freeform pixel dragging — far simpler to build and keeps every module
// aligned to the same shared grid unit (see dashboard-workspace.css).
const SPAN_OPTIONS = [
    { w: 1, h: 1, key: "1x1" },
    { w: 2, h: 1, key: "2x1" },
    { w: 1, h: 2, key: "1x2" },
    { w: 2, h: 2, key: "2x2" },
];

function SpanPicker({ value, onChange, labels, disabled }) {
    return (
        <div className="module-settings__span-picker">
            {SPAN_OPTIONS.map((span) => {
                const isActive = value?.w === span.w && value?.h === span.h;
                return (
                    <button
                        key={span.key}
                        type="button"
                        className={`module-settings__span-btn${isActive ? " module-settings__span-btn--active" : ""}`}
                        onClick={() => onChange(span)}
                        disabled={disabled}
                        title={labels?.[span.key] ?? span.key}
                    >
                        {/* A tiny w x h block preview, scaled to the option's
                            own ratio, so the shape reads at a glance instead
                            of relying purely on the "2×1" text. */}
                        <span
                            className="module-settings__span-preview"
                            style={{ "--span-w": span.w, "--span-h": span.h }}
                        />
                        <span className="module-settings__span-text">
                            {labels?.[span.key] ?? span.key}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

export default function ModuleSettings() {
    const { dashboard, addModule, removeModule, updateModuleLayout } = useDashboard();
    const { settings, loading } = useSettings();
    const [pendingSpan, setPendingSpan] = useState(SPAN_OPTIONS[0]);

    const T = useLanguage();
    const copy = T?.settings?.modules ?? {};
    const sizeCopy = copy.size ?? {};

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
                <SpanPicker value={pendingSpan} onChange={setPendingSpan} labels={sizeCopy} />

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

                                    <SpanPicker
                                        value={module.layout}
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
