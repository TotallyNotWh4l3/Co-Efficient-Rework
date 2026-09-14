// ===================================================
// ファイル名: defaultDashboard.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: デフォルトのダッシュボード設定
// ===================================================

export const DEFAULT_DASHBOARD = {
    id: "default-dashboard",

    name: "Main Dashboard",

    layout: {
        columns: 3,
        gap: 16,
        padding: 16,
    },

    modules: [
        {
            id: "weather-default",

            type: "weather",

            settings: {
                title: "Weather",
                location: "default-location",
                view: "combined",
            },

            layout: {
                w: 2,
                h: 2,
            },
        },
    ],
};