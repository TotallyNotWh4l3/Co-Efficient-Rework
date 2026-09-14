// ===================================================
// ファイル名: InterfaceSettings.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: インターフェース設定ページ コンポーネント
// ===================================================

import "./interface-settings.css";

import { useSettings } from "../../../hooks/useSettings";
import { useLanguage } from "../../../hooks/useLanguage";
import { useLocation } from "../../../hooks/useLocation";
import { useDialog } from "../../../hooks/useDialog";
import { useAuth } from "../../../hooks/useAuth";
import { useThemes } from "../../../hooks/useThemes";

import Settings from "../Components/SettingsComponents";
import LocationList from "../Components/LocationList";

import { LANGUAGE_OPTIONS } from "../../../constants/interface/languageOptions";

import { Computer } from "lucide-react";

export default function InterfaceSettings() {
    const { loading, settings, updatePreference, applyTheme, applyLocation } = useSettings();

    if (loading) {
        return <div className="interface-settings">Loading settings...</div>;
    }

    if (!settings) {
        console.log(settings);
        return <div className="interface-settings">Unable to load settings.</div>;
    }

    const { locations, locationOptions, deleteLocation } = useLocation();
    const { themes } = useThemes();
    const { openDialog } = useDialog();
    const { user } = useAuth();

    const role = user?.role?.toLowerCase();
    // Same permission tier as Locations — managing the shared list (themes,
    // locations) is manager/admin only. The backend also enforces this;
    // this just keeps the buttons from showing to everyone.
    const canManageShared = role === "manager" || role === "admin";

    const themeOptions = (themes ?? []).map((theme) => ({
        id: theme.id,
        label: theme.name,
    }));

    const currentTheme = (themes ?? []).find(
        (theme) => theme.id === settings.preferences.appearance.currentTheme,
    );

    const T = useLanguage();

    return (
        <div className="interface-settings">
            <Settings.Title Icon={Computer}>{T.settings.interface.title}</Settings.Title>

            <Settings.Description>{T.settings.interface.description}</Settings.Description>

            <Settings.Divider mod="thick" />

            {/* =======================
                LANGUAGE
            ======================== */}

            <Settings.Section>
                <Settings.SectionTitle>{T.settings.interface.language.title}</Settings.SectionTitle>

                <Settings.Description>
                    {T.settings.interface.language.description}
                </Settings.Description>

                <Settings.Select
                    value={settings.preferences.language}
                    options={LANGUAGE_OPTIONS}
                    onChange={(event) => updatePreference("language", event.target.value)}
                />
            </Settings.Section>

            <Settings.Divider />

            {/* =======================
                APPEARANCE
            ======================== */}

            <Settings.Section>
                <Settings.SectionTitle>
                    {T.settings.interface.appearance.title}
                </Settings.SectionTitle>

                <Settings.Description>
                    {T.settings.interface.appearance.description}
                </Settings.Description>

                <Settings.Select
                    value={settings.preferences.appearance.currentTheme}
                    options={themeOptions}
                    onChange={(event) => applyTheme(event.target.value)}
                />

                {canManageShared && (
                    <Settings.Row className="interface-settings__theme-actions">
                        <Settings.Button
                            variant="secondary"
                            onClick={() =>
                                openDialog({
                                    type: "theme",
                                    props: { theme: currentTheme, mode: "edit" },
                                })
                            }
                        >
                            {T.settings.interface.appearance.themes.edit}
                        </Settings.Button>

                        <Settings.Button
                            variant="secondary"
                            onClick={() =>
                                openDialog({
                                    type: "theme",
                                    props: { baseTheme: currentTheme, mode: "create" },
                                })
                            }
                        >
                            {T.settings.interface.appearance.themes.create}
                        </Settings.Button>
                    </Settings.Row>
                )}
            </Settings.Section>

            <Settings.Divider />

            {/* =======================
                LOCATION
            ======================== */}

            <Settings.Section>
                <Settings.SectionTitle>{T.settings.interface.location.title}</Settings.SectionTitle>

                <Settings.Description>
                    {T.settings.interface.location.description}
                </Settings.Description>

                {/* Every user picks their own default from the shared list. */}
                <Settings.Select
                    value={settings.preferences.locationId}
                    options={locationOptions}
                    onChange={(event) => applyLocation(event.target.value)}
                />

                {/* Managing the shared list itself (add/edit/delete) is
                    manager/admin only — the backend also enforces this,
                    this just keeps the buttons from showing to everyone. */}
                {canManageShared && (
                    <>
                        <LocationList
                            locations={locations}
                            defaultLocationId={settings.preferences.locationId}
                            canManage={canManageShared}
                            onEdit={(location) =>
                                openDialog({
                                    type: "location",
                                    props: {
                                        mode: "edit",
                                        location,
                                    },
                                })
                            }
                            onDelete={(location) =>
                                openDialog({
                                    type: "confirm",
                                    props: {
                                        title:
                                            T.settings.interface.location.deleteTitle ??
                                            "Delete location?",
                                        description:
                                            T.settings.interface.location.deleteMessage ??
                                            `Remove "${location.name}" for everyone? This can't be undone.`,
                                        confirmText:
                                            T.settings.interface.location.deleteConfirm ?? "Delete",
                                        danger: true,
                                        onConfirm: () => deleteLocation(location.id),
                                    },
                                })
                            }
                        />

                        <Settings.Button
                            variant="secondary"
                            onClick={() =>
                                openDialog({
                                    type: "location",
                                    props: {
                                        mode: "create",
                                    },
                                })
                            }
                        >
                            {T.settings.interface.location.add}
                        </Settings.Button>
                    </>
                )}
            </Settings.Section>
        </div>
    );
}
