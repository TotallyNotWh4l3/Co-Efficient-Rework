
// ===================================================
// ファイル名: lightDefault.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ライトテーマのデフォルト設定
// ===================================================

export const LIGHT_DEFAULT_THEME = {
    id: "light-default",
    name: "Light Default",
    builtIn: true,
    basedOn: null,

    appearance: {
        colors: {
            accent: "#7c3aed",
            accentHover: "#6d28d9",
            accentActive: "#5b21b6",
            accentMuted: "rgba(124, 58, 237, 0.12)",
            accentBorder: "rgba(124, 58, 237, 0.3)",

            bg: "#f8fafc",
            bgElevated: "#ffffff",
            surface: "#f1f5f9",
            surfaceElevated: "#e2e8f0",
            surfaceFloating: "#ffffff",

            element: "#ffffff",
            elementHover: "#f1f5f9",
            elementActive: "#e2e8f0",
            elementSelected: "rgba(124, 58, 237, 0.12)",
            elementDisabled: "rgba(0,0,0,0.05)",

            border: "rgba(15,23,42,0.12)",
            borderHover: "rgba(124,58,237,0.35)",
            borderActive: "rgba(124,58,237,0.6)",
            borderFocus: "#7c3aed",

            text: "#0f172a",
            textSecondary: "#475569",
            textMuted: "#64748b",
            textDisabled: "#94a3b8",
            textAccent: "#7c3aed",

            inputBg: "#ffffff",
            inputHover: "#f8fafc",
            inputFocus: "#ffffff",
            inputDisabled: "#e2e8f0",

            success: "#16a34a",
            successHover: "#15803d",

            warning: "#d97706",
            warningHover: "#b45309",

            error: "#dc2626",
            errorHover: "#b91c1c",
        },

        shadows: {
            sm: "0 2px 8px rgba(0,0,0,0.08)",
            md: "0 8px 24px rgba(0,0,0,0.12)",
            lg: "0 16px 40px rgba(0,0,0,0.16)",
        },
    },
};
