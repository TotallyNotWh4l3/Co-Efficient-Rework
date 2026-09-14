// ===================================================
// ファイル名: DashboardSettings.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ダッシュボード設定ページ コンポーネント
// ===================================================

import "./dashboard-settings.css";

import { LayoutGrid } from "lucide-react";

import { useDashboard } from "../../../hooks/useDashboard";
import { useSettings } from "../../../hooks/useSettings";
import { useLanguage } from "../../../hooks/useLanguage";

import Settings from "../Components/SettingsComponents";

const MODULE_TYPES = ["weather", "schedule", "announcement"];

export default function DashboardSettings() {
    const { dashboard, updateLayout } = useDashboard();
    const { settings, loading, updateModuleDefault } = useSettings();

    const T = useLanguage();
    const copy = T?.settings?.dashboard ?? {};
    const modulesCopy = T?.settings?.modules ?? {};

    if (loading) {
        return <div className="dashboard-settings">Loading settings...</div>;
    }

    if (!settings) {
        return <div className="dashboard-settings">Unable to load settings.</div>;
    }

    const layout = dashboard?.layout ?? { columns: 3, gap: 16, padding: 16 };

    return (
        <div className="dashboard-settings">
            <Settings.Title Icon={LayoutGrid}>{copy.title ?? "Dashboard"}</Settings.Title>

            <Settings.Description>
                {copy.description ?? "Default layout for new dashboards"}
            </Settings.Description>

            <Settings.Divider mod="thick" />

            {/* =======================
                GRID LAYOUT
            ======================== */}

            <Settings.Section>
                <Settings.SectionTitle>{copy.layout?.title ?? "Layout"}</Settings.SectionTitle>

                <Settings.Description>
                    {copy.layout?.description ?? "Spacing and column configurations"}
                </Settings.Description>

                <Settings.Row className="settings__row--stacked">
                    <Settings.RowContent>
                        <Settings.RowLabel>{copy.layout?.columns ?? "Columns"}</Settings.RowLabel>
                        <Settings.RowDescription>{layout.columns}</Settings.RowDescription>
                    </Settings.RowContent>
                    <Settings.Slider
                        min={1}
                        max={6}
                        value={layout.columns}
                        onChange={(e) => updateLayout("columns", Number(e.target.value))}
                    />
                </Settings.Row>

                <Settings.Row className="settings__row--stacked">
                    <Settings.RowContent>
                        <Settings.RowLabel>{copy.layout?.gap ?? "Spacing"}</Settings.RowLabel>
                        <Settings.RowDescription>{layout.gap}px</Settings.RowDescription>
                    </Settings.RowContent>
                    <Settings.Slider
                        min={0}
                        max={48}
                        value={layout.gap}
                        onChange={(e) => updateLayout("gap", Number(e.target.value))}
                    />
                </Settings.Row>

                <Settings.Row className="settings__row--stacked">
                    <Settings.RowContent>
                        <Settings.RowLabel>{copy.layout?.padding ?? "Padding"}</Settings.RowLabel>
                        <Settings.RowDescription>{layout.padding}px</Settings.RowDescription>
                    </Settings.RowContent>
                    <Settings.Slider
                        min={0}
                        max={48}
                        value={layout.padding}
                        onChange={(e) => updateLayout("padding", Number(e.target.value))}
                    />
                </Settings.Row>
            </Settings.Section>

            <Settings.Divider />

            {/* =======================
                PER-MODULE DEFAULTS
            ======================== */}

            <Settings.Section>
                <Settings.SectionTitle>
                    {copy.moduleDefaults?.title ?? "Module Defaults"}
                </Settings.SectionTitle>

                <Settings.Description>
                    {copy.moduleDefaults?.description ??
                        "Default settings applied when a module is added to the dashboard."}
                </Settings.Description>

                {MODULE_TYPES.map((type) => {
                    const defaults = settings.moduleDefaults?.[type] ?? {};
                    const label = modulesCopy?.[type]?.title ?? type;

                    return (
                        <div key={type} className="dashboard-settings__module-block">
                            <Settings.RowLabel className="dashboard-settings__module-name">
                                {label}
                            </Settings.RowLabel>

                            {Object.entries(defaults).map(([key, value]) => (
                                <Settings.Row key={key}>
                                    <Settings.RowContent>
                                        <Settings.RowLabel>{key}</Settings.RowLabel>
                                    </Settings.RowContent>
                                    <Settings.TextInput
                                        value={value ?? ""}
                                        onChange={(e) =>
                                            updateModuleDefault(type, key, e.target.value)
                                        }
                                    />
                                </Settings.Row>
                            ))}
                        </div>
                    );
                })}
            </Settings.Section>
        </div>
    );
}
