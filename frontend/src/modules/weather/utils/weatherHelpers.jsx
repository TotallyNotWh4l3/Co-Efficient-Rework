// ===================================================
// ファイル名: weatherHelpers.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 天気モジュール ヘルパー関数
// ===================================================

import React from "react";
import {
    Sun,
    Cloud,
    CloudSun,
    CloudSnow,
    CloudDrizzle,
    CloudRain,
    CloudLightning,
    Thermometer,
    Droplet,
    Wind,
} from "lucide-react";

const rgba = (r, g, b, a = 1) => `rgba(${r}, ${g}, ${b}, ${a})`;

// WMO weather code -> background gradient, split by day/night.
// This stays independent of the app's brand palette since it's meant
// to reflect real-world sky/atmosphere color, not UI chrome.
export const WEATHER_GRADIENTS = {
    0: {
        0: `linear-gradient(135deg, ${rgba(5, 10, 25)} 0%, ${rgba(20, 30, 60)} 100%)`,
        1: `linear-gradient(135deg, ${rgba(10, 20, 40)} 0%, ${rgba(30, 50, 80)} 100%)`,
        2: `linear-gradient(135deg, ${rgba(25, 30, 45)} 0%, ${rgba(50, 60, 80)} 100%)`,
        3: `linear-gradient(135deg, ${rgba(20, 20, 25)} 0%, ${rgba(55, 55, 65)} 100%)`,
        45: `linear-gradient(135deg, ${rgba(40, 40, 50)} 0%, ${rgba(90, 90, 110)} 100%)`,
        48: `linear-gradient(135deg, ${rgba(50, 50, 60)} 0%, ${rgba(110, 110, 130)} 100%)`,
        51: `linear-gradient(135deg, ${rgba(20, 40, 60)} 0%, ${rgba(60, 90, 110)} 100%)`,
        53: `linear-gradient(135deg, ${rgba(15, 30, 50)} 0%, ${rgba(50, 70, 90)} 100%)`,
        55: `linear-gradient(135deg, ${rgba(10, 20, 40)} 0%, ${rgba(40, 60, 80)} 100%)`,
        61: `linear-gradient(135deg, ${rgba(10, 15, 25)} 0%, ${rgba(40, 60, 80)} 100%)`,
        63: `linear-gradient(135deg, ${rgba(10, 20, 35)} 0%, ${rgba(45, 70, 95)} 100%)`,
        65: `linear-gradient(135deg, ${rgba(5, 10, 20)} 0%, ${rgba(25, 40, 60)} 100%)`,
        71: `linear-gradient(135deg, ${rgba(30, 40, 60)} 0%, ${rgba(120, 150, 180)} 100%)`,
        73: `linear-gradient(135deg, ${rgba(35, 45, 65)} 0%, ${rgba(140, 170, 200)} 100%)`,
        75: `linear-gradient(135deg, ${rgba(25, 35, 55)} 0%, ${rgba(110, 140, 170)} 100%)`,
        80: `linear-gradient(135deg, ${rgba(15, 25, 40)} 0%, ${rgba(60, 80, 100)} 100%)`,
        81: `linear-gradient(135deg, ${rgba(10, 20, 35)} 0%, ${rgba(50, 75, 100)} 100%)`,
        82: `linear-gradient(135deg, ${rgba(5, 10, 20)} 0%, ${rgba(35, 55, 75)} 100%)`,
        95: `linear-gradient(135deg, ${rgba(5, 5, 15)} 0%, ${rgba(60, 70, 120)} 100%)`,
    },
    1: {
        0: `linear-gradient(135deg, ${rgba(70, 160, 255)} 0%, ${rgba(135, 200, 255)} 100%)`,
        1: `linear-gradient(135deg, ${rgba(100, 180, 255)} 0%, ${rgba(200, 230, 255)} 100%)`,
        2: `linear-gradient(135deg, ${rgba(140, 180, 220)} 0%, ${rgba(220, 230, 240)} 100%)`,
        3: `linear-gradient(135deg, ${rgba(150, 160, 170)} 0%, ${rgba(200, 210, 220)} 100%)`,
        45: `linear-gradient(135deg, ${rgba(200, 200, 200)} 0%, ${rgba(235, 235, 235)} 100%)`,
        48: `linear-gradient(135deg, ${rgba(190, 190, 190)} 0%, ${rgba(230, 230, 230)} 100%)`,
        51: `linear-gradient(135deg, ${rgba(120, 150, 170)} 0%, ${rgba(180, 200, 210)} 100%)`,
        53: `linear-gradient(135deg, ${rgba(110, 140, 160)} 0%, ${rgba(170, 190, 200)} 100%)`,
        55: `linear-gradient(135deg, ${rgba(100, 130, 150)} 0%, ${rgba(160, 180, 190)} 100%)`,
        61: `linear-gradient(135deg, ${rgba(90, 120, 150)} 0%, ${rgba(140, 170, 190)} 100%)`,
        63: `linear-gradient(135deg, ${rgba(70, 100, 130)} 0%, ${rgba(120, 150, 170)} 100%)`,
        65: `linear-gradient(135deg, ${rgba(60, 90, 120)} 0%, ${rgba(110, 140, 160)} 100%)`,
        71: `linear-gradient(135deg, ${rgba(220, 235, 245)} 0%, ${rgba(255, 255, 255)} 100%)`,
        73: `linear-gradient(135deg, ${rgba(210, 230, 245)} 0%, ${rgba(250, 250, 255)} 100%)`,
        75: `linear-gradient(135deg, ${rgba(200, 220, 240)} 0%, ${rgba(245, 245, 255)} 100%)`,
        80: `linear-gradient(135deg, ${rgba(100, 130, 160)} 0%, ${rgba(150, 180, 200)} 100%)`,
        81: `linear-gradient(135deg, ${rgba(80, 110, 140)} 0%, ${rgba(130, 160, 180)} 100%)`,
        82: `linear-gradient(135deg, ${rgba(70, 100, 130)} 0%, ${rgba(110, 140, 160)} 100%)`,
        95: `linear-gradient(135deg, ${rgba(70, 80, 100)} 0%, ${rgba(120, 130, 160)} 100%)`,
    },
};

export function getWeatherGradient(code, isDay) {
    const modeKey = isDay ? 1 : 0;
    const modeGradients = WEATHER_GRADIENTS[modeKey] || WEATHER_GRADIENTS[1];

    if (modeGradients[code] !== undefined) {
        return modeGradients[code];
    }

    const keys = Object.keys(modeGradients).map(Number);
    const closest = keys.reduce(
        (prev, curr) => (Math.abs(curr - code) < Math.abs(prev - code) ? curr : prev),
        0,
    );
    return (
        modeGradients[closest] ||
        `linear-gradient(135deg, ${rgba(30, 40, 60)} 0%, ${rgba(100, 130, 160)} 100%)`
    );
}

export function getWeatherDescText(code, isJapanese) {
    if (isJapanese) {
        switch (code) {
            case 0:
                return "快晴 (Clear sky)";
            case 1:
                return "晴れ (Mainly clear)";
            case 2:
                return "晴れ時々曇り (Partly cloudy)";
            case 3:
                return "曇り (Overcast)";
            case 45:
            case 48:
                return "霧 (Fog)";
            case 51:
            case 53:
            case 55:
                return "霧雨 (Drizzle)";
            case 61:
            case 63:
            case 65:
                return "雨 (Rain)";
            case 71:
            case 73:
            case 75:
                return "降雪 (Snow)";
            case 80:
            case 81:
            case 82:
                return "にわか雨 (Rain Showers)";
            case 95:
                return "雷雨 (Thunderstorm)";
            default:
                return "おだやか (Calm)";
        }
    }
    switch (code) {
        case 0:
            return "Clear Sky";
        case 1:
            return "Mainly Clear";
        case 2:
            return "Partly Cloudy";
        case 3:
            return "Overcast";
        case 45:
        case 48:
            return "Foggy";
        case 51:
        case 53:
        case 55:
            return "Drizzle";
        case 61:
        case 63:
        case 65:
            return "Rainy";
        case 71:
        case 73:
        case 75:
            return "Snow Fall";
        case 80:
        case 81:
        case 82:
            return "Rain Showers";
        case 95:
            return "Thunderstorm";
        default:
            return "Calm Conditions";
    }
}

export function WeatherVisualIcon({ code, isDay, className = "" }) {
    switch (code) {
        case 0:
            return (
                <Sun
                    className={className}
                    style={{
                        color: "#facc15",
                        filter: "drop-shadow(0 0 10px rgba(250,204,21,0.5))",
                    }}
                />
            );
        case 1:
        case 2:
            return <CloudSun className={className} style={{ color: "#fde047" }} />;
        case 3:
            return <Cloud className={className} style={{ color: "#dbeafe" }} />;
        case 45:
        case 48:
            return <Cloud className={className} style={{ color: "#d1d5db", opacity: 0.8 }} />;
        case 51:
        case 53:
        case 55:
            return <CloudDrizzle className={className} style={{ color: "#93c5fd" }} />;
        case 61:
        case 63:
        case 65:
            return <CloudRain className={className} style={{ color: "#60a5fa" }} />;
        case 71:
        case 73:
        case 75:
            return <CloudSnow className={className} style={{ color: "#a5f3fc" }} />;
        case 80:
        case 81:
        case 82:
            return <CloudRain className={className} style={{ color: "#3b82f6" }} />;
        case 95:
            return <CloudLightning className={className} style={{ color: "#c084fc" }} />;
        default:
            return <Sun className={className} style={{ color: "#facc15" }} />;
    }
}

// Shared metric card definitions. `value` is filled in per-instance by the
// component that has access to current/daily data.
export const METRIC_DEFS = [
    {
        id: "temp",
        labelEn: "Temp",
        labelJa: "気温",
        color: "#f87171",
        unit: "°C",
        icon: Thermometer,
    },
    {
        id: "humidity",
        labelEn: "Humidity",
        labelJa: "ライブ湿度",
        color: "#38bdf8",
        unit: "%",
        icon: Droplet,
    },
    {
        id: "precipChance",
        labelEn: "Precip Chance",
        labelJa: "降水確率",
        color: "#a78bfa",
        unit: "%",
        icon: CloudSun,
    },
    {
        id: "precipSum",
        labelEn: "Precip Sum",
        labelJa: "降雨量",
        color: "#60a5fa",
        unit: "mm",
        icon: CloudRain,
    },
    {
        id: "windSpeed",
        labelEn: "Wind Speed",
        labelJa: "予測風速",
        color: "#2dd4bf",
        unit: "m/s",
        icon: Wind,
    },
];
