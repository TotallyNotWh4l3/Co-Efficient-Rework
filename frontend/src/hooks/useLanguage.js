// ===================================================
// ファイル名: useLanguage.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 言語情報を取得・管理するカスタムフック
// ===================================================

import { useSettings } from "./useSettings";
import { LANGUAGES } from "../constants/i18n";

function deepMerge(base, override) {
    if (typeof override !== "object" || override === null || Array.isArray(override)) {
        return override !== undefined ? override : base;
    }
    const result = { ...base };
    for (const key of Object.keys(base)) {
        result[key] = deepMerge(base[key], override[key]);
    }
    // Include any keys present in override but not in base, so new/extra
    // keys aren't silently dropped.
    for (const key of Object.keys(override)) {
        if (!(key in result)) {
            result[key] = override[key];
        }
    }
    return result;
}

export function useLanguage() {
    const { settings } = useSettings();

    const languageKey = settings?.preferences?.language ?? "en";
    const selected = LANGUAGES[languageKey] ?? LANGUAGES.en;

    // English is treated as the complete reference — any key missing from
    // the selected language (e.g. ja.js not yet covering a newer module)
    // falls back to its English value instead of crashing consumers.
    return languageKey === "en" ? selected : deepMerge(LANGUAGES.en, selected);
}
