// ===================================================
// ファイル名: NormalCustomizer.jsx
// 概要: テーマ編集の Normal モード
//       アクセント・背景・文字色など少数のベースカラーを選ぶだけで
//       残りのシェードを自動生成する
// ===================================================

import { Shuffle } from "lucide-react";

import { useLanguage } from "../settings/useLanguage";
import Settings from "../settings/components/SettingsComponents";
import ColorField from "./ColorField";
import { hslToRgb, formatColor, isLightColor, parseColor } from "./utils/colorUtils";
import { BASE_PRESETS, DEFAULT_TUNING } from "./utils/themeGenerator";

const SHADE_STRIP = [
    "bg",
    "bgElevated",
    "surface",
    "surfaceElevated",
    "surfaceFloating",
    "accentActive",
    "accent",
    "accentHover",
    "textAccent",
    "textDisabled",
    "textMuted",
    "textSecondary",
    "text",
];

const TUNING_CONTROLS = [
    { key: "contrast", min: 0.5, max: 1.8, step: 0.05 },
    { key: "border", min: 0, max: 2.5, step: 0.1 },
    { key: "shadow", min: 0, max: 2, step: 0.1 },
];

function randomAccent() {
    return formatColor(
        hslToRgb({
            h: Math.random() * 360,
            s: 55 + Math.random() * 30,
            l: 50 + Math.random() * 12,
        }),
    );
}

export default function NormalCustomizer({
    colors,
    tuning,
    disabled,
    onBaseChange,
    onTuningChange,
}) {
    const t = useLanguage().settings.interface.appearance.dialog.normal;

    const isDark = !isLightColor(parseColor(colors.bg) ? colors.bg : "#000000");

    const baseFields = [
        { key: "accent", label: t.accent },
        { key: "bg", label: t.background },
        { key: "text", label: t.text },
    ];
    const statusFields = [
        { key: "success", label: t.success },
        { key: "warning", label: t.warning },
        { key: "error", label: t.error },
    ];

    // Only commit complete colors to the generator; partial typing is kept
    // as-is by the dialog so the text field doesn't fight the user.
    const renderField = ({ key, label }) => (
        <ColorField
            key={key}
            label={label}
            value={colors[key]}
            onChange={(value) => onBaseChange({ [key]: value })}
            disabled={disabled}
        />
    );

    return (
        <div className="theme-dialog__normal">
            <Settings.Description className="theme-dialog__mode-note">
                {t.regenNote}
            </Settings.Description>

            <Settings.Section className="theme-dialog__section">
                <Settings.SectionTitle>{t.baseTitle}</Settings.SectionTitle>
                <div className="theme-dialog__segmented" role="group" aria-label={t.baseTitle}>
                    {["dark", "light"].map((mode) => (
                        <button
                            key={mode}
                            type="button"
                            className={`theme-dialog__segment${
                                (mode === "dark") === isDark ? " is-active" : ""
                            }`}
                            onClick={() => onBaseChange(BASE_PRESETS[mode])}
                            disabled={disabled}
                        >
                            {t[mode]}
                        </button>
                    ))}
                </div>
            </Settings.Section>

            <Settings.Section className="theme-dialog__section">
                <div className="theme-dialog__section-head">
                    <Settings.SectionTitle>{t.colorsTitle}</Settings.SectionTitle>
                    <button
                        type="button"
                        className="theme-dialog__ghost-btn"
                        onClick={() => onBaseChange({ accent: randomAccent() })}
                        disabled={disabled}
                    >
                        <Shuffle size={14} aria-hidden="true" />
                        {t.surprise}
                    </button>
                </div>
                <div className="theme-dialog__color-grid">{baseFields.map(renderField)}</div>
            </Settings.Section>

            <Settings.Section className="theme-dialog__section">
                <Settings.SectionTitle>{t.statusTitle}</Settings.SectionTitle>
                <div className="theme-dialog__color-grid">{statusFields.map(renderField)}</div>
            </Settings.Section>

            <Settings.Section className="theme-dialog__section">
                <div className="theme-dialog__section-head">
                    <Settings.SectionTitle>{t.tuningTitle}</Settings.SectionTitle>
                    <button
                        type="button"
                        className="theme-dialog__ghost-btn"
                        onClick={() => onTuningChange(DEFAULT_TUNING)}
                        disabled={disabled}
                    >
                        {t.reset}
                    </button>
                </div>
                <div className="theme-dialog__tuning">
                    {TUNING_CONTROLS.map(({ key, min, max, step }) => (
                        <label key={key} className="theme-dialog__tuning-row">
                            <span className="theme-dialog__color-label">{t[key]}</span>
                            <input
                                type="range"
                                className="theme-dialog__tuning-slider"
                                min={min}
                                max={max}
                                step={step}
                                value={tuning[key]}
                                onChange={(e) => onTuningChange({ [key]: Number(e.target.value) })}
                                disabled={disabled}
                            />
                            <span className="theme-dialog__alpha-value">
                                {Math.round(tuning[key] * 100)}%
                            </span>
                        </label>
                    ))}
                </div>
            </Settings.Section>

            <Settings.Section className="theme-dialog__section">
                <Settings.SectionTitle>{t.shadesTitle}</Settings.SectionTitle>
                <div className="theme-dialog__shades">
                    {SHADE_STRIP.map((key) => (
                        <span
                            key={key}
                            className="theme-dialog__shade"
                            style={{ background: colors[key] }}
                            title={key}
                        />
                    ))}
                </div>
            </Settings.Section>
        </div>
    );
}
