// ===================================================
// ファイル名: ThemeDialog.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: テーマ設定ダイアログ コンポーネント
//       Normal(ベースカラーから自動生成) / Advanced(全色を個別編集) の2モード
// ===================================================

import "./theme-dialog.css";

import { useState } from "react";
import { Link2, Link2Off } from "lucide-react";

import { useLanguage } from "../settings/useLanguage";
import { useAuth } from "../auth/useAuth";
import { uuidv4 } from "../../shared/utils/uuid";

import Settings from "../settings/components/SettingsComponents";
import ThemePreview from "./ThemePreview";
import ColorField from "./ColorField";
import NormalCustomizer from "./NormalCustomizer";

import { parseColor } from "./utils/colorUtils";
import {
    BASE_KEYS,
    DEFAULT_TUNING,
    FOLLOWERS,
    FOLLOWS,
    generateColors,
    generateShadows,
    paletteFromColors,
} from "./utils/themeGenerator";

const COLOR_GROUPS = [
    {
        key: "accent",
        fields: ["accent", "accentHover", "accentActive", "accentMuted", "accentBorder"],
    },
    {
        key: "surface",
        fields: ["bg", "bgElevated", "surface", "surfaceElevated", "surfaceFloating"],
    },
    {
        key: "element",
        fields: ["element", "elementHover", "elementActive", "elementSelected", "elementDisabled"],
    },
    {
        key: "border",
        fields: ["border", "borderHover", "borderActive", "borderFocus"],
    },
    {
        key: "text",
        fields: ["text", "textSecondary", "textMuted", "textDisabled", "textAccent"],
    },
    {
        key: "input",
        fields: ["inputBg", "inputHover", "inputFocus", "inputDisabled"],
    },
    {
        key: "status",
        fields: ["success", "successHover", "warning", "warningHover", "error", "errorHover"],
    },
];

const SHADOW_FIELDS = ["sm", "md", "lg"];

export default function ThemeDialog({
    initialTheme = null,
    baseTheme = null,
    onClose,
    onSave,
    onDelete,
}) {
    const t = useLanguage().settings.interface.appearance;
    const { user } = useAuth();
    const isAdmin = user?.role?.toLowerCase() === "admin";

    const seed = initialTheme ?? baseTheme;

    const [name, setName] = useState(
        initialTheme?.name ??
            t.dialog.defaultName.replace("{name}", baseTheme?.name ?? t.dialog.customName),
    );
    const [colors, setColors] = useState({ ...(seed?.appearance?.colors ?? {}) });
    const [shadows, setShadows] = useState({ ...(seed?.appearance?.shadows ?? {}) });
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);

    // "normal" | "advanced". Switching never alters the colors by itself —
    // Normal only regenerates shades once a base color or slider changes.
    const [mode, setMode] = useState("normal");
    const [tuning, setTuning] = useState(DEFAULT_TUNING);
    // Advanced: which shade fields the user has overridden by hand, and
    // whether editing a base color re-shades the rest.
    const [autoShade, setAutoShade] = useState(true);
    const [manual, setManual] = useState({});

    const isEditing = Boolean(initialTheme);
    const isBuiltIn = Boolean(initialTheme?.builtIn);
    // Built-in themes are locked for everyone except admins, who can edit
    // (but never delete) them.
    const isLocked = isBuiltIn && !isAdmin;

    const trimmedName = name.trim();
    const isValid = trimmedName.length > 0;

    // ---------- Normal mode ----------

    const regenerate = (palette, nextTuning) => {
        setColors((prev) => ({ ...prev, ...generateColors(palette, nextTuning) }));
        setShadows(generateShadows(palette, nextTuning));
        setManual({});
    };

    const handleBaseChange = (patch) => {
        // A half-typed value can't be shaded yet — keep it as typed.
        if (Object.values(patch).some((value) => !parseColor(value))) {
            setColors((prev) => ({ ...prev, ...patch }));
            return;
        }
        regenerate({ ...paletteFromColors(colors), ...patch }, tuning);
    };

    const handleTuningChange = (patch) => {
        const next = { ...tuning, ...patch };
        setTuning(next);
        regenerate(paletteFromColors(colors), next);
    };

    // ---------- Advanced mode ----------

    const updateColor = (key, value) => {
        setColors((prev) => {
            const next = { ...prev, [key]: value };
            if (autoShade && BASE_KEYS.includes(key) && parseColor(value)) {
                const generated = generateColors(paletteFromColors(next), tuning);
                FOLLOWERS[key].forEach((follower) => {
                    if (!manual[follower]) next[follower] = generated[follower];
                });
            }
            return next;
        });
        if (FOLLOWS[key]) setManual((prev) => ({ ...prev, [key]: true }));
    };

    const relinkField = (key) => {
        const generated = generateColors(paletteFromColors(colors), tuning);
        setColors((prev) => ({ ...prev, [key]: generated[key] }));
        setManual((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    const regenerateAllShades = () => {
        const generated = generateColors(paletteFromColors(colors), tuning);
        setColors((prev) => {
            const next = { ...prev };
            Object.keys(FOLLOWS).forEach((key) => {
                next[key] = generated[key];
            });
            return next;
        });
        setManual({});
    };

    const updateShadow = (key, value) => {
        setShadows((prev) => ({ ...prev, [key]: value }));
    };

    const renderLinkBadge = (key) => {
        if (BASE_KEYS.includes(key)) {
            return <span className="theme-dialog__badge">{t.dialog.advanced.base}</span>;
        }
        const base = FOLLOWS[key];
        if (!base || !autoShade || isLocked) return null;

        const baseLabel = base;
        if (manual[key]) {
            const label = t.dialog.advanced.unlinked.replace("{base}", baseLabel);
            return (
                <button
                    type="button"
                    className="theme-dialog__link-btn is-manual"
                    onClick={() => relinkField(key)}
                    title={label}
                    aria-label={label}
                >
                    <Link2Off size={12} aria-hidden="true" />
                </button>
            );
        }
        const label = t.dialog.advanced.linked.replace("{base}", baseLabel);
        return (
            <span className="theme-dialog__link-btn" title={label} aria-label={label}>
                <Link2 size={12} aria-hidden="true" />
            </span>
        );
    };

    // ---------- Save / delete ----------

    async function handleSave() {
        if (!isValid || saving || isLocked) return;

        setSaving(true);
        setSaveError(null);
        try {
            const themePayload = {
                id: initialTheme?.id ?? uuidv4(),
                name: trimmedName,
                // Preserve builtIn when an admin edits a built-in theme in
                // place — this must stay true, not be reset to false.
                builtIn: isBuiltIn,
                basedOn: initialTheme?.basedOn ?? baseTheme?.id ?? null,
                appearance: { colors, shadows },
            };

            if (isEditing) {
                await onSave(initialTheme.id, themePayload);
            } else {
                await onSave(themePayload);
            }
        } catch (error) {
            console.error("[ThemeDialog] Save failed:", error);
            setSaveError(error?.message || t.dialog.saveFailed);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        // Deleting a built-in theme is never allowed, even for admins.
        if (!isEditing || isBuiltIn) return;
        setSaving(true);
        setSaveError(null);
        try {
            await onDelete(initialTheme.id);
        } catch (error) {
            console.error("[ThemeDialog] Delete failed:", error);
            setSaveError(error?.message || t.dialog.deleteFailed);
            setSaving(false);
        }
    }

    return (
        <div className="theme-dialog">
            {/* Fixed header: stays put while the body scrolls */}
            <div className="theme-dialog__header">
                <Settings.Title className="theme-dialog__title">
                    {isEditing ? t.dialog.titleEdit : t.dialog.titleCreate}
                </Settings.Title>

                {isLocked && (
                    <Settings.Description className="theme-dialog__builtin-note">
                        {t.dialog.builtInNote}
                    </Settings.Description>
                )}

                {isBuiltIn && isAdmin && (
                    <Settings.Description className="theme-dialog__builtin-note">
                        {t.dialog.builtInAdminNote}
                    </Settings.Description>
                )}

                <div className="theme-dialog__mode-bar">
                    <div
                        className="theme-dialog__segmented"
                        role="tablist"
                        aria-label={t.dialog.mode.label}
                    >
                        {["normal", "advanced"].map((key) => (
                            <button
                                key={key}
                                type="button"
                                role="tab"
                                aria-selected={mode === key}
                                className={`theme-dialog__segment${mode === key ? " is-active" : ""}`}
                                onClick={() => setMode(key)}
                            >
                                {t.dialog.mode[key]}
                            </button>
                        ))}
                    </div>
                    <span className="theme-dialog__mode-hint">{t.dialog.mode[`${mode}Hint`]}</span>
                </div>
            </div>

            {/* Scrolling body: controls on the left, preview pinned on the right */}
            <div className="theme-dialog__layout">
                <div className="theme-dialog__controls">
                    <Settings.Section className="theme-dialog__section">
                        <Settings.Row>
                            <Settings.RowContent>
                                <Settings.RowLabel>{t.dialog.nameLabel}</Settings.RowLabel>
                            </Settings.RowContent>
                        </Settings.Row>
                        <Settings.TextInput
                            className="theme-dialog__input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isLocked}
                        />
                    </Settings.Section>

                    <Settings.Divider />

                    {mode === "normal" ? (
                        <NormalCustomizer
                            colors={colors}
                            tuning={tuning}
                            disabled={isLocked}
                            onBaseChange={handleBaseChange}
                            onTuningChange={handleTuningChange}
                        />
                    ) : (
                        <>
                            <div className="theme-dialog__advanced-bar">
                                <label className="theme-dialog__check">
                                    <input
                                        type="checkbox"
                                        checked={autoShade}
                                        onChange={(e) => setAutoShade(e.target.checked)}
                                        disabled={isLocked}
                                    />
                                    <span>{t.dialog.advanced.autoShade}</span>
                                </label>
                                <button
                                    type="button"
                                    className="theme-dialog__ghost-btn"
                                    onClick={regenerateAllShades}
                                    disabled={isLocked}
                                >
                                    {t.dialog.advanced.regenerate}
                                </button>
                            </div>

                            {COLOR_GROUPS.map((group) => (
                                <Settings.Section key={group.key} className="theme-dialog__section">
                                    <Settings.SectionTitle>
                                        {t.dialog.groups[group.key] ?? group.key}
                                    </Settings.SectionTitle>

                                    <div className="theme-dialog__color-grid">
                                        {group.fields.map((field) => (
                                            <ColorField
                                                key={field}
                                                label={field}
                                                value={colors[field]}
                                                onChange={(value) => updateColor(field, value)}
                                                disabled={isLocked}
                                                extra={renderLinkBadge(field)}
                                            />
                                        ))}
                                    </div>
                                </Settings.Section>
                            ))}

                            <Settings.Section className="theme-dialog__section">
                                <Settings.SectionTitle>
                                    {t.dialog.groups.shadows}
                                </Settings.SectionTitle>
                                <div className="theme-dialog__color-grid">
                                    {SHADOW_FIELDS.map((field) => (
                                        <div className="theme-dialog__shadow-field" key={field}>
                                            <span className="theme-dialog__color-label">
                                                {field}
                                            </span>
                                            <input
                                                type="text"
                                                className="theme-dialog__color-text"
                                                value={shadows[field] ?? ""}
                                                onChange={(e) =>
                                                    updateShadow(field, e.target.value)
                                                }
                                                spellCheck={false}
                                                disabled={isLocked}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </Settings.Section>
                        </>
                    )}
                </div>

                <div className="theme-dialog__preview-pane">
                    <ThemePreview colors={colors} shadows={shadows} />
                </div>
            </div>

            {/* Fixed footer */}
            <div className="theme-dialog__bottom">
                <Settings.Divider />

                {saveError && (
                    <Settings.Description className="theme-dialog__error">
                        {saveError}
                    </Settings.Description>
                )}

                <div className="theme-dialog__footer">
                    {isEditing && !isBuiltIn && (
                        <Settings.Button
                            variant="secondary"
                            className="theme-dialog__delete"
                            onClick={handleDelete}
                            disabled={saving}
                        >
                            {t.dialog.delete}
                        </Settings.Button>
                    )}

                    <div className="theme-dialog__footer-right">
                        <Settings.Button variant="secondary" onClick={onClose}>
                            {t.dialog.cancel}
                        </Settings.Button>

                        {!isLocked && (
                            <Settings.Button onClick={handleSave} disabled={!isValid || saving}>
                                {saving ? t.dialog.saving : t.dialog.save}
                            </Settings.Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
