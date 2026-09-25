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

const inFlightFetches = new Map();

// If Open-Meteo hasn't published the newest 15-min slot yet, don't let every
// page load hammer it — wait at least this long between upstream calls.
const MIN_REFETCH_INTERVAL_MS = 45_000;

// Fresh = the DATA's own timestamp (current.time) is at or after the latest
// 15-min slot that should exist by now. Judging by when *we* fetched (the old
// slot label) marked lagging data as fresh for a whole 15 minutes.
function isRowFresh(row, currentSlot = getLatestWeatherTimestamp()) {
    const dataTs = row?.payload?._dataTimestampUtc;
    if (!dataTs) return false;
    return Date.parse(dataTs) >= Date.parse(currentSlot);
}

function wasFetchedRecently(row) {
    if (!row?.fetched_at) return false;
    // SQLite CURRENT_TIMESTAMP is UTC "YYYY-MM-DD HH:MM:SS"
    const fetchedMs = Date.parse(`${String(row.fetched_at).replace(" ", "T")}Z`);
    return Date.now() - fetchedMs < MIN_REFETCH_INTERVAL_MS;
}

/** Used by the scheduler to know whether it should retry shortly. */
export async function isWeatherCurrent(locationId) {
    return isRowFresh(await getCachedWeatherRow(locationId));
}

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

    const currentSlot = getLatestWeatherTimestamp();

    if (isRowFresh(row, currentSlot)) {
        console.log("[Weather] Cache hit (data is from the current slot).");
        return stripInternalFields(row.payload);
    }

    const hasUsableCache = row?.payload && Object.keys(row.payload).length > 0;

    if (hasUsableCache && wasFetchedRecently(row)) {
        console.log("[Weather] Data is behind, but we just asked Open-Meteo — serving cache.");
        return stripInternalFields(row.payload);
    }

    console.log("[Weather] Cache data is older than the current slot (or missing), refetching...");

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
        const previous = await getCachedWeatherRow(locationId);
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
        // (Skip if Open-Meteo handed back the same interval we already had.)
        if (previous?.payload?._dataTimestampUtc !== formatted._dataTimestampUtc) {
            broadcast("weather:updated", { locationId, weather: publicPayload });
        }

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
