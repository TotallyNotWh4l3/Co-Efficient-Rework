// ===================================================
// ファイル名: seedLocations.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: デフォルトの位置情報をデータベースにシードする。
//       init.js から呼ばれるほか、単体でも実行できる。
// ===================================================

import Location from "../../modules/locations/Location.js";
import User from "../../modules/auth/User.js";
import { DEFAULT_SETTINGS } from "../../../shared/constants/defaults/defaultSettings.js";
import isMain from "./isMain.js";

// Single source of truth: seed exactly what DEFAULT_SETTINGS.locations
// defines, using the SAME ids. This matters because every new user's
// settings.preferences.locationId ("default-location") needs to actually
// resolve to a real row in the shared locations table — a randomly
// generated id here would silently break that lookup for everyone.
const DEFAULT_LOCATIONS = DEFAULT_SETTINGS.locations ?? [];

export async function seedLocations() {
    const admin = await User.findByUsername("admin");

    if (!admin) {
        throw new Error("No 'admin' user found — seed the users first.");
    }

    const existing = await Location.findAll();
    const existingIds = new Set(existing.map((loc) => loc.id));
    const existingNames = new Set(existing.map((loc) => loc.name));

    for (const loc of DEFAULT_LOCATIONS) {
        if (existingIds.has(loc.id) || existingNames.has(loc.name)) {
            console.log(`${loc.name} already exists, skipping.`);
            continue;
        }

        await Location.create({
            id: loc.id,
            userId: admin.id,
            name: loc.name,
            latitude: loc.latitude,
            longitude: loc.longitude,
            timezone: loc.timezone,
            builtIn: loc.builtIn ?? true,
        });

        console.log(`Created built-in location: ${loc.name} (ID: ${loc.id})`);
    }
}

if (isMain(import.meta.url)) {
    seedLocations()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}
