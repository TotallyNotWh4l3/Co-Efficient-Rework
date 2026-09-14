
// ===================================================
// ファイル名: ThemeDialog.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: テーマ設定ダイアログ コンポーネント
// ===================================================

import "./theme-dialog.css";

import { useState } from "react";

import { useLanguage } from "../../../hooks/useLanguage";
import { useAuth } from "../../../hooks/useAuth";

import Settings from "../Components/SettingsComponents";
import { useRef } from "react";

import {
    HEX_COLOR_PATTERN,
    hexToRgb,
    parseRgbString,
    rgbToHex,
    valueToRgbText,
} from "./utils/colorUtils";

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

function ColorField({ label, value, onChange, disabled }) {
    const colorInputRef = useRef(null);
    const [format, setFormat] = useState("hex"); // "hex" | "rgb"

    // <input type="color"> only accepts #rrggbb — some theme values here
    // are rgba(...) (e.g. accentMuted, accentBorder), so fall back to a
    // neutral hex for the picker itself when the current value isn't a
    // plain hex. Picking a new color always writes back a plain hex,
    // which will drop any alpha component the field previously had.
    const pickerValue = HEX_COLOR_PATTERN.test(value ?? "") ? value : "#000000";

    const openPicker = () => {
        if (disabled) return;
        colorInputRef.current?.click();
    };

    const toggleFormat = () => {
        if (disabled) return;
        setFormat((prev) => (prev === "hex" ? "rgb" : "hex"));
    };

    // What the text input shows, given the current format.
    const hexDisplay = HEX_COLOR_PATTERN.test(value ?? "")
        ? value.slice(1)
        : (value ?? "").replace(/^#/, "");
    const rgbDisplay = valueToRgbText(value) || "";

    const displayValue = format === "hex" ? hexDisplay : rgbDisplay;

    const handleTextChange = (raw) => {
        if (format === "hex") {
            // "#" prefix is fixed/rendered separately and can't be
            // backspaced — raw here is just whatever follows it.
            const cleaned = raw.replace(/^#/, "");
            onChange(`#${cleaned}`);
        } else {
            // Keep the raw "r, g, b" text as typed; only commit a real
            // color once it parses to three valid components.
            const rgb = parseRgbString(raw);
            if (rgb) {
                onChange(rgbToHex(rgb));
            } else {
                // Not fully valid yet (mid-typing) — still reflect what
                // they've typed so the field doesn't fight the user.
                onChange(raw);
            }
        }
    };

    return (
        <div className="theme-dialog__color-field">
            <span
                className="theme-dialog__swatch"
                style={{ background: value || "transparent" }}
                aria-hidden="true"
            />

            <input
                ref={colorInputRef}
                type="color"
                className="theme-dialog__color-picker-input"
                value={pickerValue}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                tabIndex={-1}
                aria-hidden="true"
            />

            <button
                type="button"
                className="theme-dialog__picker-btn"
                onClick={openPicker}
                disabled={disabled}
                aria-label={`Pick a color for ${label}`}
                title="Pick color"
            >
                {/* eyedropper icon */}
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                    <path
                        fill="currentColor"
                        d="M19.23 3.55a2.5 2.5 0 0 1 0 3.54l-1.94 1.94 1.06 1.06a1 1 0 0 1-1.41 1.41l-.3-.3-8.4 8.4a1 1 0 0 1-.53.28l-4.24.85a.75.75 0 0 1-.88-.88l.85-4.24a1 1 0 0 1 .28-.53l8.4-8.4-.3-.3a1 1 0 1 1 1.41-1.41l1.06 1.06 1.94-1.94a2.5 2.5 0 0 1 3.54 0Z"
                    />
                </svg>
            </button>

            <div className="theme-dialog__color-inputs">
                <span className="theme-dialog__color-label">{label}</span>

                <div className="theme-dialog__color-text-wrap">
                    {format === "hex" && (
                        <span className="theme-dialog__color-hash" aria-hidden="true">
                            #
                        </span>
                    )}
                    <input
                        type="text"
                        className="theme-dialog__color-text"
                        value={displayValue}
                        onChange={(e) => handleTextChange(e.target.value)}
                        onKeyDown={(e) => {
                            // Prevent backspacing the "#" itself in hex mode:
                            // if selection is at position 0 and backspace is
                            // pressed with nothing before the caret to delete,
                            // just no-op (there's nothing left to remove since
                            // the "#" isn't part of the input's own value).
                            if (
                                format === "hex" &&
                                e.key === "Backspace" &&
                                e.currentTarget.selectionStart === 0 &&
                                e.currentTarget.selectionEnd === 0
                            ) {
                                e.preventDefault();
                            }
                        }}
                        spellCheck={false}
                        disabled={disabled}
                        placeholder={format === "hex" ? "rrggbb" : "r, g, b"}
                    />
                </div>

                <button
                    type="button"
                    className="theme-dialog__format-toggle"
                    onClick={toggleFormat}
                    disabled={disabled}
                    aria-label={`Switch to ${format === "hex" ? "RGB" : "HEX"}`}
                    title={`Switch to ${format === "hex" ? "RGB" : "HEX"}`}
                >
                    {format === "hex" ? "HEX" : "RGB"}
                </button>
            </div>
        </div>
    );
}

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

    const [name, setName] = useState(initialTheme?.name ?? `${baseTheme?.name ?? "Custom"} Copy`);
    const [colors, setColors] = useState({ ...(seed?.appearance?.colors ?? {}) });
    const [shadows, setShadows] = useState({ ...(seed?.appearance?.shadows ?? {}) });
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);

    const isEditing = Boolean(initialTheme);
    const isBuiltIn = Boolean(initialTheme?.builtIn);
    // Built-in themes are locked for everyone except admins, who can edit
    // (but never delete) them.
    const isLocked = isBuiltIn && !isAdmin;

    const trimmedName = name.trim();
    const isValid = trimmedName.length > 0;

    const updateColor = (key, value) => {
        setColors((prev) => ({ ...prev, [key]: value }));
    };

    const updateShadow = (key, value) => {
        setShadows((prev) => ({ ...prev, [key]: value }));
    };

    async function handleSave() {
        if (!isValid || saving || isLocked) return;

        setSaving(true);
        setSaveError(null);
        try {
            const themePayload = {
                id: initialTheme?.id ?? crypto.randomUUID(),
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
            <Settings.Title className="theme-dialog__title">
                {isEditing ? t.dialog.titleEdit : t.dialog.titleCreate}
            </Settings.Title>

            <Settings.Divider />

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
                            />
                        ))}
                    </div>
                </Settings.Section>
            ))}

            <Settings.Section className="theme-dialog__section">
                <Settings.SectionTitle>{t.dialog.groups.shadows}</Settings.SectionTitle>
                <div className="theme-dialog__color-grid">
                    {SHADOW_FIELDS.map((field) => (
                        <div className="theme-dialog__shadow-field" key={field}>
                            <span className="theme-dialog__color-label">{field}</span>
                            <input
                                type="text"
                                className="theme-dialog__color-text"
                                value={shadows[field] ?? ""}
                                onChange={(e) => updateShadow(field, e.target.value)}
                                spellCheck={false}
                                disabled={isLocked}
                            />
                        </div>
                    ))}
                </div>
            </Settings.Section>

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
    );
}
