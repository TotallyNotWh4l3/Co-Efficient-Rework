// ===================================================
// ファイル名: useHolidayName.js
// 概要: 現在の表示言語で祝日名を返す関数を提供するフック
// ===================================================

import { useCallback } from "react";
import { useSettings } from "../../settings/useSettings";
import { getHolidayName } from "./holidays";

/** Returns (dateStr) => holiday name in the user's language, or null. */
export default function useHolidayName() {
    const { settings } = useSettings();
    const language = settings?.preferences?.language ?? "en";
    return useCallback((dateStr) => getHolidayName(dateStr, language), [language]);
}
