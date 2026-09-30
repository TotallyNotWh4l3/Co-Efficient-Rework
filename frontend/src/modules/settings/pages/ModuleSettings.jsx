// ===================================================
// ファイル名: ModuleSettings.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: モジュール設定ページ コンポーネント
// ===================================================

import "./module-settings.css";

import { useState, useEffect } from "react";
import { Blocks, Plus } from "lucide-react";

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
                label={labels?.width}
                value={w}
                min={1}
                max={maxW}
                disabled={disabled}
                onCommit={(nextW) => onChange({ w: nextW, h })}
            />
            <span className="module-settings__size-times">×</span>
            <SizeField
                label={labels?.height}
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
        { type: "weather", name: copy.weather?.title },
        { type: "schedule", name: copy.schedule?.title },
        { type: "todaySchedule", name: copy.todaySchedule?.title },
        { type: "clock", name: copy.clock?.title },
        { type: "announcement", name: copy.announcements?.title },
    ];

    if (loading) {
        return <div className="module-settings">{T.settings.status.loading}</div>;
    }

    if (!settings) {
        return <div className="module-settings">{T.settings.status.loadFailed}</div>;
    }

    return (
        <div className="module-settings">
            <Settings.Title Icon={Blocks}>{copy.title}</Settings.Title>

            <Settings.Description>
                {copy.description}
            </Settings.Description>

            <Settings.Divider mod="thick" />

            {/* =======================
                AVAILABLE MODULES
            ======================== */}

            <Settings.Section>
                <Settings.SectionTitle>{copy.available}</Settings.SectionTitle>

                <Settings.Description>
                    {copy.availableDescription}
                </Settings.Description>

                <span className="module-settings__span-label">{sizeCopy.label}</span>
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
                <Settings.SectionTitle>{positionCopy.title}</Settings.SectionTitle>

                <Settings.Description>
                    {positionCopy.description}
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
                    onResize={updateModuleLayout}
                    onRemove={removeModule}
                    copy={positionCopy}
                />
            </Settings.Section>
        </div>
    );
}
