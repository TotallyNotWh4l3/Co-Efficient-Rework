// ===================================================
// ファイル名: transitLane.js
// 概要: 路線図ビュー用の状態計算。方面ごとの「次の発車」と現在時刻から、
//       レーンが今どの状態か(waiting / inbound / approaching / atStation / departed)
//       と、車両アイコンの位置を決める。時刻表は発車時刻しか持たないので、
//       「到着」は発車時刻の dwellSec 秒前として扱う。
//       深夜便(24:10 など)に対応するため、前日・当日・翌日の時刻表を
//       絶対時刻(ミリ秒)に展開してから比較する。
// ===================================================

import { departuresFor, getDayType, toDisplayTime, toMinutes } from "./transitHelpers";

// ===================================================
// ★ EDIT HERE ★  Line-view timing. Every value is in SECONDS (write minutes as 3 * 60).
//
//   departure ─ stopSec ─▶ the train is ARRIVED and sits on the station point
//   arrival   ─ appearSec ▶ the train icon first shows up and starts sliding in
//   arrival   ─ toastSec ─▶ the "A train is coming" toast shows (before the icon)
//
//   timeline for one train (not to scale):
//
//   toast ........ icon appears ........ arrives (stops) ........ departs ...... gone
//   |<-- toastSec -->|                    |<--- stopSec --->|      |<- heldSec ->|
//                    |<-- appearSec ----->|
//
//   toastSec   : how long BEFORE ARRIVAL the toast appears (keep it >= appearSec)
//   appearSec  : how long BEFORE ARRIVAL the icon appears on the line
//   stopSec    : how long the train STOPS at the station before the timetable departure time
//   heldSec    : how long the "just departed" state lasts after departure
// ===================================================
export const LANE_TIMING = {
    // station = train
    station: { toastSec: 10 * 60, appearSec: 2 * 60 + 30, stopSec: 30, heldSec: 60 },
    // busStop = bus
    busStop: { toastSec: 10 * 60, appearSec: 90, stopSec: 20, heldSec: 45 },
};

// Minutes-only timer: at or under this many seconds it shows "Arriving Soon" instead of a number.
export const ARRIVING_SOON_SEC = 90;

// Where the station point sits on the track, in % of its width.
// Left of it is the inbound side, right of it the line the vehicle leaves along.
export const STATION_X = 68;
export const EXIT_X = 112; // departed vehicles slide past the right edge and fade out

/** Departures of one direction as absolute times (ms), covering yesterday, today and tomorrow. */
export function laneDepartures(direction, now) {
    const out = [];
    for (const offset of [-1, 0, 1]) {
        const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
        for (const dep of departuresFor(direction, getDayType(day))) {
            const at = new Date(
                day.getFullYear(),
                day.getMonth(),
                day.getDate(),
                0,
                toMinutes(dep.time),
            ).getTime();
            out.push({ ...dep, at, displayTime: toDisplayTime(toMinutes(dep.time)) });
        }
    }
    return out.sort((a, b) => a.at - b.at);
}

/**
 * State of one lane at `now`.
 * Returns { phase, progress, next, last, following, secondsToNext, vehicleKey, vehicleX, vehicleOpacity }.
 * `mode` is the stop type: "station" | "busStop".
 */
export function getLaneState(direction, mode, now) {
    const timing = LANE_TIMING[mode] ?? LANE_TIMING.station;
    const t = now.getTime();

    const deps = laneDepartures(direction, now);
    const nextIdx = deps.findIndex((d) => d.at > t);
    const next = nextIdx === -1 ? null : deps[nextIdx];
    const last = (nextIdx === -1 ? deps[deps.length - 1] : deps[nextIdx - 1]) ?? null;
    const following = nextIdx === -1 ? [] : deps.slice(nextIdx + 1, nextIdx + 3);
    const secondsToNext = next ? Math.max(0, Math.ceil((next.at - t) / 1000)) : null;
    const sec = next ? (next.at - t) / 1000 : Infinity;

    // The timetable only has departure times, so arrival = departure - stopSec.
    const arrivalSec = sec - timing.stopSec; // seconds until the vehicle reaches the station

    let phase = "waiting";
    let progress = 0;

    // A vehicle that is about to leave wins over one that has just left.
    if (arrivalSec <= 0) {
        phase = "atStation";
    } else if (arrivalSec <= timing.appearSec) {
        phase = "approaching";
        progress = 1 - arrivalSec / timing.appearSec;
    } else if (last && t - last.at < timing.heldSec * 1000) {
        phase = "departed";
        progress = (t - last.at) / (timing.heldSec * 1000);
    } else if (arrivalSec <= timing.toastSec) {
        phase = "inbound";
    }

    // Same key from approaching -> atStation -> departed, so one vehicle moves continuously.
    const vehicleKey =
        phase === "departed"
            ? last.at
            : phase === "approaching" || phase === "atStation"
              ? next.at
              : null;

    let vehicleX = null;
    let vehicleOpacity = 0;
    if (phase === "approaching") {
        vehicleX = STATION_X * progress;
        vehicleOpacity = 1;
    } else if (phase === "atStation") {
        vehicleX = STATION_X;
        vehicleOpacity = 1;
    } else if (phase === "departed") {
        vehicleX = STATION_X + (EXIT_X - STATION_X) * progress;
        vehicleOpacity = Math.min(1, 2 * (1 - progress));
    }

    return {
        phase,
        progress,
        next,
        last,
        following,
        secondsToNext,
        vehicleKey,
        vehicleX,
        vehicleOpacity,
    };
}

/** 754 -> "12:34", 3725 -> "1:02:05". Language-neutral, so no i18n needed. */
export function formatCountdown(totalSeconds) {
    if (totalSeconds == null) return "--:--";
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/**
 * Minutes-only timer text. Returns { kind: "soon" | "now" | "minutes" | "none", n, h, m }:
 *  - "soon"    : 90 s or less to go (ARRIVING_SOON_SEC)
 *  - "now"     : the vehicle is standing at the station
 *  - "minutes" : whole minutes left (rounded up), split into h / m when over an hour
 */
export function getMinuteTimer(state) {
    if (state.secondsToNext == null) return { kind: "none" };
    if (state.phase === "atStation") return { kind: "now" };
    if (state.secondsToNext <= ARRIVING_SOON_SEC) return { kind: "soon" };
    const n = Math.ceil(state.secondsToNext / 60);
    return { kind: "minutes", n, h: Math.floor(n / 60), m: n % 60 };
}

export const fillTemplate = (template, values) =>
    template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? "");
