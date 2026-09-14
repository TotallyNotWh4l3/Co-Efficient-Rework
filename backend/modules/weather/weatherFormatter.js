// ===================================================
// ファイル名: weatherFormatter.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 天気情報フォーマッタ
// ===================================================

import { WEATHER_CODES, DEFAULT_WEATHER } from "../../../shared/constants/weather/weatherCodes.js";

function getWeatherInfo(code, isDay) {
    const weather = WEATHER_CODES[code] ?? DEFAULT_WEATHER;

    return {
        weatherCode: code,
        description: weather.label,
        icon: isDay ? weather.day : weather.night,
    };
}

export function formatWeather(raw) {
    const currentWeather = getWeatherInfo(raw.current.weather_code, Boolean(raw.current.is_day));

    return {
        location: {
            latitude: raw.latitude,
            longitude: raw.longitude,
            timezone: raw.timezone,
        },
        current: {
            time: raw.current.time,
            temperature: Math.round(raw.current.temperature_2m),
            feelsLike: Math.round(raw.current.apparent_temperature),
            humidity: raw.current.relative_humidity_2m,
            precipitation: raw.current.precipitation,
            cloudCover: raw.current.cloud_cover,
            windSpeed: raw.current.wind_speed_10m,
            windDirection: raw.current.wind_direction_10m,
            windGust: raw.current.wind_gusts_10m,
            isDay: Boolean(raw.current.is_day),
            ...currentWeather,
        },
        hourly: raw.hourly.time.map((time, index) => ({
            time,
            temperature: Math.round(raw.hourly.temperature_2m[index]),
            humidity: raw.hourly.relative_humidity_2m[index],
            precipitation: raw.hourly.precipitation_probability[index],
            precipitationSum: raw.hourly.precipitation[index],
            windSpeed: raw.hourly.wind_speed_10m[index],
            weatherCode: raw.hourly.weather_code[index],
        })),
        daily: raw.daily.time.map((date, index) => ({
            date,
            high: Math.round(raw.daily.temperature_2m_max[index]),
            low: Math.round(raw.daily.temperature_2m_min[index]),
            sunrise: raw.daily.sunrise[index],
            sunset: raw.daily.sunset[index],
            uvIndex: raw.daily.uv_index_max[index],
            precipitation: raw.daily.precipitation_probability_max[index],
            precipitationSum: raw.daily.precipitation_sum[index],
            precipitationHours: raw.daily.precipitation_hours[index],
            windSpeed: raw.daily.wind_speed_10m_max[index],
            weatherCode: raw.daily.weather_code[index],
            description: getWeatherInfo(raw.daily.weather_code[index], true).description,
            icon: getWeatherInfo(raw.daily.weather_code[index], true).icon,
        })),
    };
}
