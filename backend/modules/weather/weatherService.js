// ===================================================
// ファイル名: weatherService.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 天気情報サービス
// ===================================================

import { fetchWeather } from "./openMeteoService.js";
import {
    getCachedWeatherRow,
    setCachedWeather,
    getLatestWeatherTimestamp,
    claimFetch,
    releaseFetchClaim,
} from "./weatherDataStore.js";
import { formatWeather } from "./weatherFormatter.js";
import { broadcast } from "../../sse/SSEController.js";

const FIFTEEN_MIN_MS = 15 * 60 * 1000;


const inFlightFetches = new Map();

/**
 * @param {{ id: string, latitude: number, longitude: number, timezone?: string }} location
 */
export async function getWeather(location) {
    const { id: locationId, timezone = "Asia/Tokyo" } = location;

    const latitude = Number(location.latitude);
    const longitude = Number(location.longitude);

    if (!location) {
        let locations = await Location.findAllByUserId(req.user.id);

        if (locations.length === 0) {
            const userSettings = await UserSettings.findByUserId(req.user.id);
            const settingsLocations = userSettings?.settings?.locations ?? [];

            for (const loc of settingsLocations) {
                await Location.create({
                    id: loc.id,
                    userId: req.user.id,
                    name: loc.name,
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    timezone: loc.timezone ?? "Asia/Tokyo",
                    builtIn: Boolean(loc.builtIn),
                });
            }

            locations = await Location.findAllByUserId(req.user.id);
        }

        location = locations.find((l) => l.builtIn) ?? locations[0] ?? null;
    }

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        throw new Error("Invalid coordinates.");
    }

    const row = await getCachedWeatherRow(locationId);

    if (row?.payload?._dataTimestampUtc) {
        const dataAgeMs = Date.now() - new Date(row.payload._dataTimestampUtc).getTime();

        if (dataAgeMs >= 0 && dataAgeMs <= FIFTEEN_MIN_MS) {
            console.log("[Weather] Cache hit.");
            return stripInternalFields(row.payload);
        }

        console.log("[Weather] Cached data older than 15min (or clock skew), refetching...");
    } else {
        console.log("[Weather] No cache, fetching Open-Meteo...");
    }

    if (inFlightFetches.has(locationId)) {
        console.log("[Weather] Refetch already in flight on this instance, joining it.");
        return inFlightFetches.get(locationId);
    }

    const fetchPromise = refetchAndCache(locationId, latitude, longitude, timezone).finally(() => {
        inFlightFetches.delete(locationId);
    });

    inFlightFetches.set(locationId, fetchPromise);
    return fetchPromise;
}

async function refetchAndCache(locationId, latitude, longitude, timezone) {
    const wonClaim = await claimFetch(locationId);

    if (!wonClaim) {
        const existing = await getCachedWeatherRow(locationId);
        const hasUsableCache = existing?.payload && Object.keys(existing.payload).length > 0;

        if (hasUsableCache) {
            console.log("[Weather] Lost the cross-instance fetch race, serving existing cache.");
            return stripInternalFields(existing.payload);
        }

        console.log("[Weather] Lost the claim but no usable cache exists yet — fetching anyway.");
    }

    try {
        const raw = await fetchWeather(latitude, longitude, timezone);
        const formatted = formatWeather(raw);

        const utcOffsetSeconds = raw.utc_offset_seconds ?? 0;
        const dataTimestampMs = Date.parse(`${raw.current.time}Z`) - utcOffsetSeconds * 1000;
        formatted._dataTimestampUtc = new Date(dataTimestampMs).toISOString();

        // 4. Store cache (this also clears the claim on success)
        await setCachedWeather(locationId, getLatestWeatherTimestamp(), formatted);

        const publicPayload = stripInternalFields(formatted);

        // Push the fresh data to every connected client watching this
        // location — this is what replaces the old frontend polling loop.
        // Locations aren't per-user private (see Location.findById's
        // comment), so this is a global broadcast, same as
        // announcements/schedule/themes/locations.
        broadcast("weather:updated", { locationId, weather: publicPayload });

        return publicPayload;
    } catch (error) {
        // Only release if we actually held the claim — never clear a
        // claim we don't own.
        if (wonClaim) {
            await releaseFetchClaim(locationId);
        }
        throw error;
    }
}

function stripInternalFields(payload) {
    const { _dataTimestampUtc, ...rest } = payload;
    return rest;
}
