// ===================================================
// ファイル名: weatherGradients.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 天気グレードの定義
// ===================================================

const opacity = 0.85;

const rgba = (r, g, b) => `rgba(${r}, ${g}, ${b}, ${opacity})`;

const GRADIENTS = {
    day: {
        clear: `linear-gradient(135deg,
            ${rgba(74, 158, 255)} 0%,
            ${rgba(145, 210, 255)} 100%)`,

        partlyCloudy: `linear-gradient(135deg,
            ${rgba(120, 180, 235)} 0%,
            ${rgba(215, 235, 255)} 100%)`,

        cloudy: `linear-gradient(135deg,
            ${rgba(150, 160, 175)} 0%,
            ${rgba(215, 220, 230)} 100%)`,

        fog: `linear-gradient(135deg,
            ${rgba(185, 190, 195)} 0%,
            ${rgba(235, 235, 235)} 100%)`,

        drizzle: `linear-gradient(135deg,
            ${rgba(120, 145, 170)} 0%,
            ${rgba(185, 205, 220)} 100%)`,

        rain: `linear-gradient(135deg,
            ${rgba(70, 105, 145)} 0%,
            ${rgba(130, 165, 190)} 100%)`,

        snow: `linear-gradient(135deg,
            ${rgba(220, 235, 245)} 0%,
            ${rgba(255, 255, 255)} 100%)`,

        thunder: `linear-gradient(135deg,
            ${rgba(75, 85, 110)} 0%,
            ${rgba(130, 140, 175)} 100%)`,
    },

    night: {
        clear: `linear-gradient(135deg,
            ${rgba(8, 16, 32)} 0%,
            ${rgba(28, 48, 80)} 100%)`,

        partlyCloudy: `linear-gradient(135deg,
            ${rgba(28, 36, 54)} 0%,
            ${rgba(58, 68, 88)} 100%)`,

        cloudy: `linear-gradient(135deg,
            ${rgba(28, 28, 35)} 0%,
            ${rgba(58, 58, 70)} 100%)`,

        fog: `linear-gradient(135deg,
            ${rgba(42, 42, 52)} 0%,
            ${rgba(95, 95, 110)} 100%)`,

        drizzle: `linear-gradient(135deg,
            ${rgba(22, 36, 55)} 0%,
            ${rgba(60, 85, 105)} 100%)`,

        rain: `linear-gradient(135deg,
            ${rgba(8, 16, 28)} 0%,
            ${rgba(42, 62, 82)} 100%)`,

        snow: `linear-gradient(135deg,
            ${rgba(34, 44, 64)} 0%,
            ${rgba(118, 148, 176)} 100%)`,

        thunder: `linear-gradient(135deg,
            ${rgba(8, 8, 20)} 0%,
            ${rgba(72, 82, 135)} 100%)`,
    },
};

const WEATHER_GROUPS = {
    // Clear
    0: "clear",

    // Clouds
    1: "partlyCloudy",
    2: "partlyCloudy",
    3: "cloudy",

    // Fog
    45: "fog",
    48: "fog",

    // Drizzle
    51: "drizzle",
    53: "drizzle",
    55: "drizzle",
    56: "drizzle",
    57: "drizzle",

    // Rain
    61: "rain",
    63: "rain",
    65: "rain",
    66: "rain",
    67: "rain",
    80: "rain",
    81: "rain",
    82: "rain",

    // Snow
    71: "snow",
    73: "snow",
    75: "snow",
    77: "snow",
    85: "snow",
    86: "snow",

    // Thunderstorm
    95: "thunder",
    96: "thunder",
    99: "thunder",
};

export function getWeatherGradient(weatherCode, isDay) {
    const period = isDay ? "day" : "night";

    const group = WEATHER_GROUPS[weatherCode] ?? "clear";

    return GRADIENTS[period][group];
}
