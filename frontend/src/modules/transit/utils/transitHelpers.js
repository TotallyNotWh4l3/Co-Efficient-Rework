// ===================================================
// ファイル名: transitHelpers.js
// 作成日: 2026/09/30
// 作成者: ゴンザガ　ウェイン
// 概要: 時刻表の曜日区分の判定と、「次の発車」の計算。
//       深夜の便は "24:10" のように24時以上で保存されているため、
//       前日の時刻表の深夜便(0時を過ぎてからの発車)も「今日の発車」として扱う。
// ===================================================

import { getHolidayName } from "../../schedule/utils/holidays";
import { formatDateStr } from "../../schedule/utils/scheduleHelpers";

const DAY_MIN = 24 * 60;
const pad = (n) => String(n).padStart(2, "0");

/** "24:10" -> 1450 (分)。 */
export function toMinutes(time) {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}

/** 1450 -> "00:10" (24時以上は0時台に戻して表示)。 */
export function toDisplayTime(minutes) {
    return `${pad(Math.floor(minutes / 60) % 24)}:${pad(minutes % 60)}`;
}

function addDays(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
}

/**
 * 曜日区分: 祝日と日曜 -> "holiday"、土曜 -> "saturday"、それ以外 -> "weekday"。
 * 土曜日が祝日のときは "holiday" が優先される。
 */
export function getDayType(date) {
    if (date.getDay() === 0 || getHolidayName(formatDateStr(date))) return "holiday";
    if (date.getDay() === 6) return "saturday";
    return "weekday";
}

/** 方面内の全 service を合わせた、その曜日区分の発車リスト (時刻順)。 */
export function departuresFor(direction, dayType) {
    const multiLine = direction.services.length > 1;
    return direction.services
        .flatMap((svc) => {
            const timetable = svc.timetables.find((tt) => tt.days.includes(dayType));
            return (timetable?.departures ?? []).map((d) => ({
                ...d,
                line: svc.line,
                multiLine,
            }));
        })
        .sort((a, b) => a.time.localeCompare(b.time));
}

/**
 * 現在時刻以降の発車を最大 limit 本返す。
 *  - 前日の時刻表の深夜便 (24:xx 以降) も含める
 *  - 今日の残りが足りなければ、翌日の時刻表から補う (tomorrow: true)
 * 戻り値の各要素: { ...departure, displayTime, wait (分), tomorrow }
 */
export function getUpcoming(direction, now, limit) {
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const items = [];

    // 前日ダイヤの深夜便 (例: 昨日の 24:40 は、今日の 00:40)
    for (const d of departuresFor(direction, getDayType(addDays(now, -1)))) {
        const m = toMinutes(d.time);
        if (m >= DAY_MIN && m - DAY_MIN >= nowMin) {
            items.push({ ...d, displayTime: toDisplayTime(m), wait: m - DAY_MIN - nowMin });
        }
    }

    // 今日のダイヤ
    for (const d of departuresFor(direction, getDayType(now))) {
        const m = toMinutes(d.time);
        if (m >= nowMin) {
            items.push({ ...d, displayTime: toDisplayTime(m), wait: m - nowMin });
        }
    }

    // 翌日のダイヤ (足りない分だけ)
    if (items.length < limit) {
        for (const d of departuresFor(direction, getDayType(addDays(now, 1)))) {
            const m = toMinutes(d.time);
            if (m >= DAY_MIN) continue; // 翌日の深夜便は遠すぎるので対象外
            items.push({
                ...d,
                displayTime: toDisplayTime(m),
                wait: DAY_MIN + m - nowMin,
                tomorrow: true,
            });
        }
    }

    return items.sort((a, b) => a.wait - b.wait).slice(0, limit);
}
