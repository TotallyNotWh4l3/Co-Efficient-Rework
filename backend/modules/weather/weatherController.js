// ===================================================
// ファイル名: weatherController.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 天気情報の管理を行うAPIコントローラー。ユーザーの位置情報に基づいた天気情報の取得などの機能を提供します。
// ===================================================


import Location from "../locations/Location.js";
import UserSettings from "../settings/UserSettings.js";
import { getWeather } from "./weatherService.js";

export async function getWeatherController(req, res) {
    try {
        // console.log("========== WEATHER REQUEST ==========");
        // console.log("[Weather] User:", req.user);

        const requestedLocationId = req.query.locationId;

        let location = null;

        if (requestedLocationId) {
            location = await Location.findById(requestedLocationId, req.user.id);

            // Not in the locations table yet — it may only exist in the
            // user's settings JSON (e.g. added via the Settings UI, which
            // still writes there). Sync it over so future lookups and the
            // weather cache work off the real table going forward.
            if (!location) {
                const userSettings = await UserSettings.findByUserId(req.user.id);
                const settingsLocation = userSettings?.settings?.locations?.find(
                    (loc) => loc.id === requestedLocationId,
                );

                if (settingsLocation) {
                    console.log(
                        "[Weather] Syncing location from settings into locations table:",
                        settingsLocation,
                    );

                    await Location.create({
                        id: settingsLocation.id,
                        userId: req.user.id,
                        name: settingsLocation.name,
                        latitude: settingsLocation.latitude,
                        longitude: settingsLocation.longitude,
                        timezone: settingsLocation.timezone ?? "Asia/Tokyo",
                        builtIn: Boolean(settingsLocation.builtIn),
                    });

                    location = await Location.findById(requestedLocationId, req.user.id);
                }
            }
        }

        // Still nothing — fall back to the user's built-in default, then
        // to whatever's first.
        if (!location) {
            const locations = await Location.findAllByUserId(req.user.id);
            location = locations.find((l) => l.builtIn) ?? locations[0] ?? null;
        }

        // console.log("[Weather] Selected Location:", location);

        if (!location) {
            return res.status(404).json({
                message: "No location found for user.",
            });
        }

        const weather = await getWeather(location);

        weather.location = {
            ...weather.location,
            id: location.id,
            name: location.name,
        };

        // console.log("[Weather] Weather fetched successfully.");
        // console.log("=====================================");

        res.json(weather);
    } catch (error) {
        console.error("[Weather]", error);

        res.status(500).json({
            message: error.message,
        });
    }
}
