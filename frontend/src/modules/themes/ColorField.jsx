// ===================================================
// ファイル名: ColorField.jsx
// 概要: テーマ用カラー入力フィールド (カラーピッカー / HEX / RGB / 不透明度)
//       ThemeDialog (Advanced) と NormalCustomizer で共用
// ===================================================

import { useRef, useState } from "react";

import { useLanguage } from "../settings/useLanguage";
import {
    HEX_COLOR_PATTERN,
    formatColor,
    getAlpha,
    hexToRgb,
    parseColor,
    parseRgbString,
    rgbToHex,
    valueToRgbText,
} from "./utils/colorUtils";

export default function ColorField({ label, value, onChange, disabled, extra = null }) {
    const dialogCopy = useLanguage().settings.interface.appearance.dialog;
    const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
    const colorInputRef = useRef(null);
    const [format, setFormat] = useState("hex"); // "hex" | "rgb"
    const switchLabel = fill(dialogCopy.switchTo, { format: format === "hex" ? "RGB" : "HEX" });

    const parsed = parseColor(value);
    const alpha = getAlpha(value);

    // <input type="color"> only accepts #rrggbb, so feed it the opaque part
    // of whatever the value currently is. Alpha is kept separately and
    // re-applied on every change, so picking a color no longer drops the
    // opacity of rgba() fields like accentMuted.
    const pickerValue = parsed ? rgbToHex(parsed) : "#000000";

    const openPicker = () => {
        if (disabled) return;
        colorInputRef.current?.click();
    };

    const toggleFormat = () => {
        if (disabled) return;
        setFormat((prev) => (prev === "hex" ? "rgb" : "hex"));
    };

    const hexDisplay = parsed
        ? rgbToHex(parsed).slice(1)
        : HEX_COLOR_PATTERN.test(value ?? "")
          ? value.slice(1)
          : (value ?? "").replace(/^#/, "");
    const rgbDisplay = valueToRgbText(value) || "";
    const displayValue = format === "hex" ? hexDisplay : rgbDisplay;

    const handlePicked = (hex) => {
        const rgb = hexToRgb(hex);
        if (rgb) onChange(formatColor({ ...rgb, a: alpha }));
    };

    const handleTextChange = (raw) => {
        if (format === "hex") {
            const cleaned = raw.replace(/^#/, "");
            const next = `#${cleaned}`;
            // Only normalise once a full 6-digit hex is typed, otherwise a
            // valid 3-digit prefix would expand under the user mid-typing.
            if (cleaned.length === 6 && HEX_COLOR_PATTERN.test(next)) {
                onChange(formatColor({ ...hexToRgb(next), a: alpha }));
            } else {
                onChange(next);
            }
        } else {
            const rgb = parseRgbString(raw);
            if (rgb) {
                onChange(formatColor({ ...rgb, a: alpha }));
            } else {
                onChange(raw);
            }
        }
    };

    const handleAlphaChange = (percent) => {
        if (!parsed) return;
        onChange(formatColor({ ...parsed, a: Number(percent) / 100 }));
    };

    return (
        <div className="theme-dialog__color-field">
            <span className="theme-dialog__swatch-wrap" aria-hidden="true">
                <span
                    className="theme-dialog__swatch"
                    style={{ background: value || "transparent" }}
                />
            </span>

            <input
                ref={colorInputRef}
                type="color"
                className="theme-dialog__color-picker-input"
                value={pickerValue}
                onChange={(e) => handlePicked(e.target.value)}
                disabled={disabled}
                tabIndex={-1}
                aria-hidden="true"
            />

            <button
                type="button"
                className="theme-dialog__picker-btn"
                onClick={openPicker}
                disabled={disabled}
                aria-label={fill(dialogCopy.pickColorFor, { label })}
                title={dialogCopy.pickColor}
            >
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                    <path
                        fill="currentColor"
                        d="M19.23 3.55a2.5 2.5 0 0 1 0 3.54l-1.94 1.94 1.06 1.06a1 1 0 0 1-1.41 1.41l-.3-.3-8.4 8.4a1 1 0 0 1-.53.28l-4.24.85a.75.75 0 0 1-.88-.88l.85-4.24a1 1 0 0 1 .28-.53l8.4-8.4-.3-.3a1 1 0 1 1 1.41-1.41l1.06 1.06 1.94-1.94a2.5 2.5 0 0 1 3.54 0Z"
                    />
                </svg>
            </button>

            <div className="theme-dialog__color-inputs">
                <div className="theme-dialog__color-label-row">
                    <span className="theme-dialog__color-label">{label}</span>
                    {extra}
                </div>

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

                <div className="theme-dialog__alpha-row">
                    <button
                        type="button"
                        className="theme-dialog__format-toggle"
                        onClick={toggleFormat}
                        disabled={disabled}
                        aria-label={switchLabel}
                        title={switchLabel}
                    >
                        {format === "hex" ? "HEX" : "RGB"}
                    </button>
                    <input
                        type="range"
                        className="theme-dialog__alpha-slider"
                        min={0}
                        max={100}
                        value={Math.round(alpha * 100)}
                        onChange={(e) => handleAlphaChange(e.target.value)}
                        disabled={disabled || !parsed}
                        aria-label={dialogCopy.advanced.alpha}
                        title={dialogCopy.advanced.alpha}
                    />
                    <span className="theme-dialog__alpha-value">{Math.round(alpha * 100)}%</span>
                </div>
            </div>
        </div>
    );
}
