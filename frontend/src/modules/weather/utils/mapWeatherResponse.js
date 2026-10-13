// ===================================================
// ファイル名: mapWeatherResponse.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 天気レスポンスのマッピング処理
// ===================================================

function toHHMM(isoString) {
    if (!isoString) return "--:--";
    const timePart = isoString.split("T")[1];
    return timePart ? timePart.slice(0, 5) : "--:--";
}

function dateKeyOf(isoString) {
    return isoString ? isoString.split("T")[0] : "";
}

// Average of a numeric field over an array of hourly items (nulls ignored).
// Returns null when there's nothing to average. `digits` = decimal places.
function avgOf(items, key, digits = 0) {
    const vals = items.map((h) => h[key]).filter((v) => typeof v === "number");
    if (vals.length === 0) return null;
    const avg = vals.reduce((sum, v) => sum + v, 0) / vals.length;
    const f = 10 ** digits;
    return Math.round(avg * f) / f;
}

// metres -> km, one decimal. Tolerates missing values (e.g. an older cached payload).
const toKm = (m) => (typeof m === "number" ? Math.round(m / 100) / 10 : null);

function getDayLabel(dateStr, index, lang) {
    const forecastCopy = lang?.modules?.weather?.forecast ?? {};

    // if (index === 0) return forecastCopy.today ?? "Today";
    // if (index === 1) return forecastCopy.tomorrow ?? "Tomorrow";

    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) {
        const fallback = forecastCopy.dayFallback ?? "Day {n}";
        return fallback.replace("{n}", index + 1);
    }

    const weekdays = lang?.dateNames?.weekdaysShort;
    return weekdays?.[d.getDay()] ?? d.toLocaleDateString(undefined, { weekday: "short" });
}

/**
 * Transforms the backend's /weather response (see weatherFormatter.js) into
 * the { current, dailyList, hourlyByDay } shape WeatherModule expects.
 *
 * @param {object} weather — response from GET /weather (formatWeather output)
 * @param {object} lang — the full language object from useLanguage()
 */
export function mapWeatherResponse(weather, lang) {
    if (!weather) return null;

    const { current, hourly = [], daily = [] } = weather;

    const hourlyByDate = {};
    for (const item of hourly) {
        const key = dateKeyOf(item.time);
        if (!hourlyByDate[key]) hourlyByDate[key] = [];
        hourlyByDate[key].push(item);
    }

    const dailyList = daily.map((day, index) => {
        const hoursForDay = hourlyByDate[day.date] || [];
        const avgHumidity = hoursForDay.length
            ? Math.round(
                  hoursForDay.reduce((sum, h) => sum + (h.humidity ?? 0), 0) / hoursForDay.length,
              )
            : null;

        return {
            dayLabel: getDayLabel(day.date, index, lang),
            date: day.date,
            maxTemp: day.high,
            minTemp: day.low,
            weatherCode: day.weatherCode,
            humidity: avgHumidity,
            precipChance: day.precipitation,
            precipSum: day.precipitationSum,
            windSpeed: day.windSpeed,
            windGust: day.windGust ?? null,
            // Feels-like keeps the max/min pair like temperature does.
            maxFeelsLike: day.feelsLikeHigh ?? null,
            minFeelsLike: day.feelsLikeLow ?? null,
            // No daily values from the API for these two — average the hours.
            dewPoint: avgOf(hoursForDay, "dewPoint", 1),
            visibility: toKm(avgOf(hoursForDay, "visibility")),
            uvIndex: day.uvIndex ?? null,
        };
    });

    const hourlyByDay = {};
    daily.forEach((day, index) => {
        hourlyByDay[index] = (hourlyByDate[day.date] || []).map((h) => ({
            time: toHHMM(h.time),
            temp: h.temperature,
            feelsLike: h.feelsLike ?? null,
            dewPoint: h.dewPoint ?? null,
            visibility: toKm(h.visibility),
            uvIndex: h.uvIndex ?? null,
            windGust: h.windGust ?? null,
            humidity: h.humidity,
            precipChance: h.precipitation,
            precipSum: h.precipitationSum,
            windSpeed: h.windSpeed,
            weatherCode: h.weatherCode,
        }));
    });

    const todayHigh = dailyList[0]?.maxTemp ?? current?.temperature ?? 0;
    const todayLow = dailyList[0]?.minTemp ?? current?.temperature ?? 0;
    const todayPrecipChance = dailyList[0]?.precipChance ?? 0;

    return {
        current: {
            temperature: current?.temperature ?? 0,
            humidity: current?.humidity ?? 0,
            windSpeed: current?.windSpeed ?? 0,
            precipChance: todayPrecipChance,
            weatherCode: current?.weatherCode ?? 3,
            isDay: current?.isDay ? 1 : 0,
            highTemp: todayHigh,
            lowTemp: todayLow,
            time: toHHMM(current?.time),
        },
        dailyList,
        hourlyByDay,
        locationName: weather.location?.name,
    };
}
