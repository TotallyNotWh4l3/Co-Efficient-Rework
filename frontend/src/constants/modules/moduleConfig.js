
// ===================================================
// ファイル名: moduleConfig.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: モジュール設定
// ===================================================

export const MODULE_CONFIG = [
    {
        id: "weather",

        nameKey: "weather",
        descriptionKey: "weather",

        settings: [
            {
                key: "forecastDays",
                labelKey: "forecastDays",
                type: "range",

                min: 1,
                max: 14,
            },

            {
                key: "showAlerts",
                labelKey: "showAlerts",
                type: "toggle",
            },
        ],
    },

    {
        id: "schedule",

        nameKey: "schedule",
        descriptionKey: "schedule",

        settings: [
            {
                key: "viewMode",
                labelKey: "viewMode",

                type: "select",

                options: [
                    {
                        value: "relative",
                        labelKey: "relative",
                    },

                    {
                        value: "absolute",
                        labelKey: "absolute",
                    },
                ],
            },

            {
                key: "daysBeforeToday",
                labelKey: "daysBeforeToday",

                type: "range",

                min: 0,
                max: 7,
            },
        ],
    },

    {
        id: "announcement",

        nameKey: "announcements",
        descriptionKey: "announcements",

        settings: [
            {
                key: "maxDisplay",
                labelKey: "maxDisplay",

                type: "range",

                min: 1,
                max: 10,
            },
        ],
    },
];
