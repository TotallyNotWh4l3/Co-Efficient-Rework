// ===================================================
// ファイル名: openMeteoService.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: Open-Meteo API サービス
// ===================================================


const OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast";

const DEFAULT_TIMEZONE = "Asia/Tokyo";

const REQUEST_TIMEOUT = 5000;

function buildApiUrl(latitude, longitude, timezone = DEFAULT_TIMEZONE) {
    const params = new URLSearchParams({
        latitude,
        longitude,

        current: [
            "temperature_2m",
            "relative_humidity_2m",
            "apparent_temperature",
            "is_day",
            "precipitation",
            "weather_code",
            "cloud_cover",
            "wind_speed_10m",
            "wind_direction_10m",
            "wind_gusts_10m",
        ].join(","),

        hourly: [
            "temperature_2m",
            "relative_humidity_2m",
            "dew_point_2m",
            "apparent_temperature",
            "precipitation_probability",
            "precipitation",
            "weather_code",
            "visibility",
            "wind_speed_10m",
            "wind_gusts_10m",
            "uv_index",
        ].join(","),

        daily: [
            "weather_code",
            "temperature_2m_max",
            "temperature_2m_min",
            "apparent_temperature_max",
            "apparent_temperature_min",
            "sunrise",
            "sunset",
            "daylight_duration",
            "uv_index_max",
            "precipitation_sum",
            "precipitation_hours",
            "precipitation_probability_max",
            "wind_speed_10m_max",
            "wind_gusts_10m_max",
            "wind_direction_10m_dominant",
        ].join(","),

        forecast_days: 7,

        timezone,

        wind_speed_unit: "ms",
    });

    return `${OPEN_METEO_BASE_URL}?${params.toString()}`;
}

export async function fetchWeather(latitude, longitude, timezone = DEFAULT_TIMEZONE) {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
        controller.abort();
    }, REQUEST_TIMEOUT);

    try {
        const response = await fetch(buildApiUrl(latitude, longitude, timezone), {
            signal: controller.signal,
            headers: {
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`Open-Meteo responded with ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        if (error.name === "AbortError") {
            throw new Error("Open-Meteo request timed out.");
        }

        throw error;
    } finally {
        clearTimeout(timeout);
    }
}
