// ===================================================
// ファイル名: WeatherHeader.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 天気ヘッダー コンポーネント
// ===================================================

import React from "react";
import { MapPin } from "lucide-react";
import { useLanguage } from "../../settings/useLanguage";
import "../weather.css";

export default function WeatherHeader({
    locationOptions = [],
    selectedLocationId,
}) {
    const lang = useLanguage();
    const t = lang.modules.weather.header;

    const selectedLabel =
        locationOptions.find((loc) => loc.id === selectedLocationId)?.label ?? t.selectLocation;

    return (
        <div className="weather-header">
            <div className="weather-header__location">
                <MapPin className="weather-header__pin-icon" color="#f88" />
                <span className="weather-header__select-label">{selectedLabel}</span>
            </div>
        </div>
    );
}
