
// ===================================================
// ファイル名: weatherCodes.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 天気コードの定義
// ===================================================

export const WEATHER_CODES = {
    // Clear / Clouds
    0: {
        day: "sun",
        night: "moon",
        label: "Clear Sky",
    },

    1: {
        day: "cloud-sun",
        night: "cloud-moon",
        label: "Mainly Clear",
    },

    2: {
        day: "cloud-sun",
        night: "cloud-moon",
        label: "Partly Cloudy",
    },

    3: {
        day: "cloud",
        night: "cloud",
        label: "Overcast",
    },

    // Fog
    45: {
        day: "cloud-fog",
        night: "cloud-fog",
        label: "Fog",
    },

    48: {
        day: "cloud-fog",
        night: "cloud-fog",
        label: "Depositing Rime Fog",
    },

    // Drizzle
    51: {
        day: "cloud-drizzle",
        night: "cloud-drizzle",
        label: "Light Drizzle",
    },

    53: {
        day: "cloud-drizzle",
        night: "cloud-drizzle",
        label: "Moderate Drizzle",
    },

    55: {
        day: "cloud-drizzle",
        night: "cloud-drizzle",
        label: "Dense Drizzle",
    },

    // Freezing Drizzle
    56: {
        day: "cloud-sleet",
        night: "cloud-sleet",
        label: "Light Freezing Drizzle",
    },

    57: {
        day: "cloud-sleet",
        night: "cloud-sleet",
        label: "Dense Freezing Drizzle",
    },

    // Rain
    61: {
        day: "cloud-rain",
        night: "cloud-rain",
        label: "Slight Rain",
    },

    63: {
        day: "cloud-rain",
        night: "cloud-rain",
        label: "Moderate Rain",
    },

    65: {
        day: "cloud-rain",
        night: "cloud-rain",
        label: "Heavy Rain",
    },

    // Freezing Rain
    66: {
        day: "cloud-sleet",
        night: "cloud-sleet",
        label: "Light Freezing Rain",
    },

    67: {
        day: "cloud-sleet",
        night: "cloud-sleet",
        label: "Heavy Freezing Rain",
    },

    // Snow
    71: {
        day: "cloud-snow",
        night: "cloud-snow",
        label: "Slight Snow Fall",
    },

    73: {
        day: "cloud-snow",
        night: "cloud-snow",
        label: "Moderate Snow Fall",
    },

    75: {
        day: "cloud-snow",
        night: "cloud-snow",
        label: "Heavy Snow Fall",
    },

    77: {
        day: "snowflake",
        night: "snowflake",
        label: "Snow Grains",
    },

    // Rain Showers
    80: {
        day: "cloud-rain",
        night: "cloud-rain",
        label: "Slight Rain Showers",
    },

    81: {
        day: "cloud-rain",
        night: "cloud-rain",
        label: "Moderate Rain Showers",
    },

    82: {
        day: "cloud-rain",
        night: "cloud-rain",
        label: "Violent Rain Showers",
    },

    // Snow Showers
    85: {
        day: "cloud-snow",
        night: "cloud-snow",
        label: "Slight Snow Showers",
    },

    86: {
        day: "cloud-snow",
        night: "cloud-snow",
        label: "Heavy Snow Showers",
    },

    // Thunderstorm
    95: {
        day: "cloud-lightning",
        night: "cloud-lightning",
        label: "Thunderstorm",
    },

    96: {
        day: "cloud-lightning-rain",
        night: "cloud-lightning-rain",
        label: "Thunderstorm with Slight Hail",
    },

    99: {
        day: "cloud-lightning-rain",
        night: "cloud-lightning-rain",
        label: "Thunderstorm with Heavy Hail",
    },
};

export const DEFAULT_WEATHER = WEATHER_CODES[0];
