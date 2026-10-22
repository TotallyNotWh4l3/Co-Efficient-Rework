// ===================================================
// ファイル名: holidays.js
// 概要: 日本の祝日を調べるヘルパー。内閣府のデータに基づく
//       @holiday-jp/holiday_jp をアプリに同梱して使うので、オフラインでも動く。
//       振替休日・国民の休日・春分/秋分の日もデータに含まれている。
// ===================================================

import { holidays } from "@holiday-jp/holiday_jp";

/**
 * Holiday name for a "YYYY-MM-DD" string, or null if it isn't a national holiday.
 * Returns the Japanese name for language "ja", English otherwise.
 */
export function getHolidayName(dateStr, language = "en") {
    const holiday = holidays[dateStr];
    if (!holiday) return null;
    return language === "ja" ? holiday.name : holiday.name_en;
}
