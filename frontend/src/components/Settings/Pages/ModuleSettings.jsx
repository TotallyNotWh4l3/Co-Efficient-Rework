
// ===================================================
// ファイル名: ModuleSettings.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: モジュール設定ページ コンポーネント
// ===================================================

import "./module-settings.css";

import { Blocks, Plus, Trash2 } from "lucide-react";

import { useDashboard } from "../../../hooks/useDashboard";
import { useSettings } from "../../../hooks/useSettings";
import { useLanguage } from "../../../hooks/useLanguage";

import Settings from "../Components/SettingsComponents";

export default function ModuleSettings() {
    const { dashboard, addModule, removeModule } = useDashboard();
    const { settings, loading } = useSettings();

    const T = useLanguage();
    const copy = T?.settings?.modules ?? {};

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

                <div className="module-settings__grid">
                    {AVAILABLE_MODULES.map((module) => (
                        <button
                            key={module.type}
                            type="button"
                            className="module-settings__add-card"
                            onClick={() =>
                                addModule(module.type, settings.moduleDefaults?.[module.type] ?? {})
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
                                <li key={module.id} className="module-settings__list-item">
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
                                </li>
                            );
                        })}
                    </ul>
                )}
            </Settings.Section>
        </div>
    );
}
