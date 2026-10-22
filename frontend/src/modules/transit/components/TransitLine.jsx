// ===================================================
// ファイル名: TransitLine.jsx
// 概要: 路線図ビューの1レーン(1方面)。白黒の路線に駅の点があり、
//       車両アイコンが時刻に合わせて動く。電車とバスは同じ仕組みで、
//       アイコンと線のデザインだけが違う。
//         waiting     : まだ遠い。次の発車だけ表示
//         inbound     : 遠いが向かっている。トースト表示(アイコンはまだ出ない)
//         approaching : 近い。残り時間に応じてアイコンが駅へスライド
//         atStation   : 駅の点に白いボックスが止まっている
//         departed    : 発車直後。アイコンが右へ抜けていく
//       縦表示では下から上へ進む(上が行き先)。位置は 100 - x% で反転して使う。
// ===================================================

import React from "react";
import { ArrowUp, BusFront, TrainFront } from "lucide-react";
import {
    fillTemplate,
    formatCountdown,
    getLaneState,
    getMinuteTimer,
    STATION_X,
    VEHICLE_GLIDE_MS,
} from "../utils/transitLane";

import "./transit-line.css";

export default function TransitLine({
    direction,
    mode,
    now,
    t,
    vertical = false,
    themed = false,
    minutesOnly = false,
}) {
    const isBus = mode === "busStop";
    const L = t.line;
    const state = getLaneState(direction, mode, now);
    const { phase, next, last, following } = state;

    const VehicleIcon = isBus ? BusFront : TrainFront;
    const phaseLabel =
        phase === "atStation" && isBus
            ? L.phase.atStop
            : phase === "departed" && last
              ? fillTemplate(L.departedAt, { time: last.displayTime })
              : L.phase[phase];

    const minutesLeft = state.secondsToNext == null ? 0 : Math.ceil(state.secondsToNext / 60);

    // Timer text: m:ss, or (minutes-only option) "5 min" / "Arriving Soon" / "Now".
    let countText = formatCountdown(state.secondsToNext);
    if (minutesOnly) {
        const timer = getMinuteTimer(state);
        if (timer.kind === "soon") countText = L.arrivingSoon;
        else if (timer.kind === "now") countText = t.now;
        else if (timer.kind === "none") countText = "--";
        else
            countText =
                timer.h > 0
                    ? fillTemplate(L.hourMinutes, { h: timer.h, m: timer.m })
                    : fillTemplate(L.minutes, { n: timer.n });
    }
    const typeLabel = next ? (t.types[next.type] ?? next.type) : null;

    return (
        <section
            className={`trl-lane trl-lane--${phase}${isBus ? " trl-lane--bus" : ""}${
                vertical ? " trl-lane--vertical" : ""
            }${themed ? " trl-lane--themed" : ""}`}
        >
            <header className="trl-head">
                <span className="trl-dir">{direction.label}</span>
                <span className="trl-phase">{phaseLabel}</span>
                <span
                    className={`trl-count${minutesOnly ? " trl-count--text" : ""}`}
                    aria-label={next ? `${next.time}` : undefined}
                >
                    {countText}
                </span>
            </header>

            <div
                className="trl-track"
                style={{ "--trl-station-x": `${STATION_X}%` }}
                role="img"
                aria-label={phaseLabel}
            >
                <div className="trl-rail" />
                {vertical && <ArrowUp className="trl-dest-arrow" aria-hidden="true" />}
                <div
                    className={`trl-station${phase === "atStation" ? " trl-station--active" : ""}`}
                />

                {state.vehicleKey != null && (
                    <div
                        key={state.vehicleKey}
                        className={`trl-vehicle${phase === "atStation" ? " trl-vehicle--arrived" : ""}`}
                        style={{
                            [vertical ? "top" : "left"]:
                                `${vertical ? 100 - state.vehicleX : state.vehicleX}%`,
                            opacity: state.vehicleOpacity,
                            "--vehicle-glide": `${VEHICLE_GLIDE_MS}ms`,
                        }}
                    >
                        <VehicleIcon className="trl-vehicle-icon" />
                    </div>
                )}

                {phase === "inbound" && (
                    <div
                        className="trl-toast"
                        role="status"
                        title={fillTemplate(isBus ? L.comingBus : L.comingTrain, {
                            n: minutesLeft,
                        })}
                    >
                        <VehicleIcon className="trl-toast-icon" />
                        <span>
                            {vertical
                                ? fillTemplate(L.minutes, { n: minutesLeft })
                                : fillTemplate(isBus ? L.comingBus : L.comingTrain, {
                                      n: minutesLeft,
                                  })}
                        </span>
                    </div>
                )}
            </div>

            <footer className="trl-foot">
                {next ? (
                    <>
                        <span className="trl-next-time">{next.displayTime}</span>
                        <span className="trl-next-dest">
                            {next.dest ? fillTemplate(t.toDest, { dest: next.dest }) : next.line}
                        </span>
                        <span className={`trn-type trn-type--${next.type}`}>{typeLabel}</span>
                        {following.length > 0 && (
                            <span className="trl-following">
                                {L.following} {following.map((d) => d.displayTime).join(" · ")}
                            </span>
                        )}
                    </>
                ) : (
                    <span className="trl-following">{t.noService}</span>
                )}
            </footer>
        </section>
    );
}
