
// ===================================================
// ファイル名: darkDefault.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ダークテーマのデフォルト設定
// ===================================================

export const DARK_DEFAULT_THEME = {
    id: "dark-default",
    name: "Dark Default",
    builtIn: true,
    basedOn: null,

    appearance: {
        colors: {
            accent: "#7c3aed",
            accentHover: "#8b5cf6",
            accentActive: "#6d28d9",
            accentMuted: "rgba(124, 58, 237, 0.15)",
            accentBorder: "rgba(124, 58, 237, 0.35)",

            bg: "#090b13",
            bgElevated: "#0e1220",
            surface: "#151a2d",
            surfaceElevated: "#1b2138",
            surfaceFloating: "#222943",

            element: "#151a2d",
            elementHover: "#1a2036",
            elementActive: "#232b47",
            elementSelected: "rgba(124, 58, 237, 0.18)",
            elementDisabled: "rgba(255, 255, 255, 0.04)",

            border: "rgba(255, 255, 255, 0.08)",
            borderHover: "rgba(124, 58, 237, 0.35)",
            borderActive: "rgba(124, 58, 237, 0.65)",
            borderFocus: "#8b5cf6",

            text: "#f8fafc",
            textSecondary: "#b8c0d9",
            textMuted: "#7e87a7",
            textDisabled: "#5b6380",
            textAccent: "#a78bfa",

            inputBg: "#0e1220",
            inputHover: "#151a2d",
            inputFocus: "#1b2138",
            inputDisabled: "#090b13",

            success: "#22c55e",
            successHover: "#16a34a",

            warning: "#f59e0b",
            warningHover: "#d97706",

            error: "#ef4444",
            errorHover: "#dc2626",
        },

        shadows: {
            sm: "0 2px 8px rgba(0,0,0,0.25)",
            md: "0 8px 24px rgba(0,0,0,0.35)",
            lg: "0 16px 40px rgba(0,0,0,0.45)",
        },
    },
};
