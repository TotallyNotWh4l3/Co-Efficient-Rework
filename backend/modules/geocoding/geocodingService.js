// ===================================================
// ファイル名: geocodingService.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 逆地理コーディングサービス
// ===================================================

const OPEN_METEO_GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";

// Nominatim's usage policy requires a descriptive User-Agent identifying the
// application — requests without one are liable to be blocked.
const NOMINATIM_USER_AGENT = "CoEfficient-Dashboard/1.0 (internal tool)";

/**
 * @param {string} query - place name to search for, e.g. "Tokyo"
 * @returns {Promise<Array<{name: string, latitude: number, longitude: number, country: string, timezone: string}>>}
 */
export async function forwardGeocode(query) {
    const url = `${OPEN_METEO_GEOCODING_URL}?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Open-Meteo geocoding request failed: ${response.status}`);
    }

    const data = await response.json();
    const results = Array.isArray(data.results) ? data.results : [];

    return results.map((r) => ({
        name: r.admin1 ? `${r.name}, ${r.admin1}, ${r.country}` : `${r.name}, ${r.country}`,
        latitude: r.latitude,
        longitude: r.longitude,
        country: r.country,
        timezone: r.timezone,
    }));
}

/**
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<string>} a display name for the coordinates
 */
export async function reverseGeocode(latitude, longitude) {
    const url = `${NOMINATIM_REVERSE_URL}?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`;

    const response = await fetch(url, {
        headers: { "User-Agent": NOMINATIM_USER_AGENT },
    });
    if (!response.ok) {
        throw new Error(`Nominatim reverse geocoding request failed: ${response.status}`);
    }

    const data = await response.json();
    const address = data.address || {};

    // Prefer city-level names, fall back progressively to broader areas.
    const place =
        address.city || address.town || address.village || address.suburb || address.county;
    const region = address.state || address.region;
    const country = address.country;

    const parts = [place, region, country].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : data.display_name || `${latitude}, ${longitude}`;
}
