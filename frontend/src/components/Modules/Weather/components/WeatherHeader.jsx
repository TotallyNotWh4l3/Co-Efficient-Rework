
// ===================================================
// ファイル名: WeatherHeader.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 天気ヘッダー コンポーネント
// ===================================================

import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MapPin, Settings, ChevronDown, Check } from "lucide-react";
import { useLanguage } from "../../../../hooks/useLanguage";
import "../weather.css";

export default function WeatherHeader({
    locationOptions = [],
    selectedLocationId,
    onLocationChange,
    isManagerOrAbove,
    showSettings,
    onToggleSettings,
    onRemove,
}) {
    const lang = useLanguage();
    const t = lang.modules.weather.header;

    const selectedLabel =
        locationOptions.find((loc) => loc.id === selectedLocationId)?.label ?? t.selectLocation;

    return (
        <div className="weather-header">
            <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                    <button className="weather-header__location" type="button">
                        <MapPin className="weather-header__pin-icon" />
                        <span className="weather-header__select-label">{selectedLabel}</span>
                        <ChevronDown className="weather-header__select-chevron" />
                    </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                    <DropdownMenu.Content
                        className="weather-header__dropdown-content"
                        sideOffset={6}
                        align="start"
                    >
                        {locationOptions.map((loc) => (
                            <DropdownMenu.Item
                                key={loc.id}
                                className="weather-header__dropdown-item"
                                onSelect={() => onLocationChange && onLocationChange(loc.id)}
                            >
                                <span className="weather-header__dropdown-item-label">
                                    {loc.label}
                                </span>
                                {loc.id === selectedLocationId && (
                                    <Check className="weather-header__dropdown-item-check" />
                                )}
                            </DropdownMenu.Item>
                        ))}
                    </DropdownMenu.Content>
                </DropdownMenu.Portal>
            </DropdownMenu.Root>

            <div className="weather-header__actions">
                {isManagerOrAbove && (
                    <button
                        onClick={onToggleSettings}
                        className={`weather-header__icon-btn${showSettings ? " weather-header__icon-btn--settings-active" : ""}`}
                        title={t.moduleSettings}
                    >
                        <Settings className="weather-header__pin-icon" />
                    </button>
                )}
                <button
                    onClick={onRemove}
                    className="weather-header__icon-btn weather-header__icon-btn--remove"
                    title={t.remove}
                >
                    ✕
                </button>
            </div>
        </div>
    );
}
