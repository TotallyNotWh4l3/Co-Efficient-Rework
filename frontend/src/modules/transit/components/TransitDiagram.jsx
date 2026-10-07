// ===================================================
// ファイル名: TransitDiagram.jsx
// 概要: 縦表示の路線図。上り・下りの2方面を1本の線にまとめて描く。
//         ・上の端 = heading "up" の方面 (例: 名古屋)、下の端 = heading "down" の方面 (例: 賢島)
//         ・up の電車は下から上へ、down の電車は上から下へ進む。駅は線の真ん中。
//         ・複線: 日本は左側通行なので、up の線は左、down の線は右。駅は両方にまたがる (同時に停車しても重ならない)。
//         ・種別(普通/急行/特急)は文字ではなく色で区別する。色は transit-diagram.css の
//           --trd-c-* を編集。詳細(発車時刻・種別・行き先)は電車やトーストにホバーすると表示。
//       各方面の状態計算は getLaneState (utils/transitLane.js) をそのまま使う。
// ===================================================

import React, { useState } from "react";
import { ArrowDown, ArrowUp, BusFront, TrainFront } from "lucide-react";
import {
    EXIT_X,
    fillTemplate,
    formatCountdown,
    getLaneState,
    getMinuteTimer,
    STATION_X,
    VEHICLE_GLIDE_MS,
} from "../utils/transitLane";

import "./transit-diagram.css";

const headingOf = (d, i) => d.heading ?? (i === 0 ? "up" : "down");

/** getLaneState の vehicleX (0→STATION_X→EXIT_X) を、線上の位置(上からの%)に直す。駅 = 50%。 */
function railPos(x, heading) {
    const up =
        x <= STATION_X
            ? 100 - 50 * (x / STATION_X) // 下の端 → 駅
            : 50 - 62 * ((x - STATION_X) / (EXIT_X - STATION_X)); // 駅 → 上の端の外 (-12%)
    return heading === "up" ? up : 100 - up;
}

function countText(state, minutesOnly, t) {
    const L = t.line;
    if (!minutesOnly) return formatCountdown(state.secondsToNext);
    const timer = getMinuteTimer(state);
    if (timer.kind === "soon") return L.arrivingSoon;
    if (timer.kind === "now") return t.now;
    if (timer.kind === "none") return "--";
    return timer.h > 0
        ? fillTemplate(L.hourMinutes, { h: timer.h, m: timer.m })
        : fillTemplate(L.minutes, { n: timer.n });
}

/** 端ごとの代表: グループ内でいちばん早く来る方面。 */
function soonest(group) {
    return group.reduce(
        (best, l) =>
            best == null ||
            (l.state.secondsToNext ?? Infinity) < (best.state.secondsToNext ?? Infinity)
                ? l
                : best,
        null,
    );
}

function EndBlock({ group, side, isBus, minutesOnly, t }) {
    const L = t.line;
    const Arrow = side === "top" ? ArrowUp : ArrowDown;
    const lead = soonest(group);
    const { state } = lead;
    const { phase, next, last, following } = state;
    const phaseLabel =
        phase === "atStation" && isBus
            ? L.phase.atStop
            : phase === "departed" && last
              ? fillTemplate(L.departedAt, { time: last.displayTime })
              : L.phase[phase];

    return (
        <div className={`trd-end trd-end--${side} trd-end--${phase}`}>
            <div className="trd-end-top">
                <span className="trd-end-label">
                    <Arrow className="trd-end-arrow" aria-hidden="true" />
                    <span>{group.map((l) => l.d.label).join(" / ")}</span>
                </span>
                <span className={`trd-count${minutesOnly ? " trd-count--text" : ""}`}>
                    {countText(state, minutesOnly, t)}
                </span>
            </div>
            <div className="trd-end-sub">
                <span className="trd-phase">{phaseLabel}</span>
                {next ? (
                    <>
                        <span className={`trd-next trd-t--${next.type}`}>
                            <span className="trd-type-dot" />
                            <span className="trd-next-time">{next.displayTime}</span>
                            <span className="trd-next-dest">
                                {next.dest
                                    ? fillTemplate(t.toDest, { dest: next.dest })
                                    : next.line}
                            </span>
                        </span>
                        {following.length > 0 && (
                            <span className="trd-following">
                                {L.following} {following.map((d) => d.displayTime).join(" · ")}
                            </span>
                        )}
                    </>
                ) : (
                    <span className="trd-following">{t.noService}</span>
                )}
            </div>
        </div>
    );
}

function Tip({ dep, pos, t }) {
    const L = t.line;
    const meta = [dep.line, dep.series].filter(Boolean).join(" · ");
    return (
        <div
            className={`trd-tip ${pos >= 50 ? "trd-tip--above" : "trd-tip--below"}`}
            style={{ top: `${pos}%` }}
            role="tooltip"
        >
            <dl className="trd-tip-list">
                <dt>{L.tip.departs}</dt>
                <dd>{dep.displayTime}</dd>
                <dt>{L.tip.type}</dt>
                <dd className={`trd-t--${dep.type}`}>
                    <span className="trd-type-dot" />
                    {t.types[dep.type] ?? dep.type}
                </dd>
                <dt>{L.tip.dest}</dt>
                <dd>{dep.dest ?? dep.line}</dd>
                {meta && (
                    <>
                        <dt>{L.tip.line}</dt>
                        <dd>{meta}</dd>
                    </>
                )}
            </dl>
        </div>
    );
}

export default function TransitDiagram({
    directions,
    mode,
    now,
    t,
    themed = false,
    minutesOnly = false,
}) {
    const isBus = mode === "busStop";
    const L = t.line;
    const VehicleIcon = isBus ? BusFront : TrainFront;
    const [hover, setHover] = useState(null); // `${directionId}|vehicle` | `${directionId}|toast`

    const lanes = directions.map((d, i) => ({
        d,
        heading: headingOf(d, i),
        state: getLaneState(d, mode, now),
    }));
    const top = lanes.filter((l) => l.heading === "up");
    const bottom = lanes.filter((l) => l.heading === "down");

    const hoverProps = (key) => ({
        onMouseEnter: () => setHover(key),
        onMouseLeave: () => setHover(null),
        onFocus: () => setHover(key),
        onBlur: () => setHover(null),
        tabIndex: 0,
    });

    // 画面に出ている電車・トースト (ホバー用に位置と表示対象の便をここで決める)
    const items = [];
    for (const { d, heading, state } of lanes) {
        const { phase, next, last } = state;
        if (state.vehicleKey != null) {
            const dep = phase === "departed" ? last : next;
            items.push({
                kind: "vehicle",
                id: d.id,
                heading,
                state,
                dep,
                pos: railPos(state.vehicleX, heading),
            });
        }
        if (phase === "inbound" && next) {
            items.push({
                kind: "toast",
                id: d.id,
                heading,
                state,
                dep: next,
                pos: heading === "up" ? 88 : 12,
            });
        }
    }
    const hovered = hover ? items.find((it) => `${it.id}|${it.kind}` === hover) : null;
    const atStation = lanes.some((l) => l.state.phase === "atStation");

    return (
        <section
            className={`trd${isBus ? " trd--bus" : ""}${themed ? " trd--themed" : ""}`}
            aria-label={directions.map((d) => d.label).join(" / ")}
        >
            {top.length > 0 && (
                <EndBlock group={top} side="top" isBus={isBus} minutesOnly={minutesOnly} t={t} />
            )}

            <div className="trd-track">
                <div className="trd-stage">
                    {top.length > 0 && <div className="trd-rail trd-rail--up" />}
                    {bottom.length > 0 && <div className="trd-rail trd-rail--down" />}
                    {top.length > 0 && (
                        <ArrowUp className="trd-arrow trd-arrow--top" aria-hidden="true" />
                    )}
                    {bottom.length > 0 && (
                        <ArrowDown className="trd-arrow trd-arrow--bottom" aria-hidden="true" />
                    )}
                    <div className={`trd-station${atStation ? " trd-station--active" : ""}`} />

                    {items.map((it) => {
                        const key = `${it.id}|${it.kind}`;
                        if (it.kind === "toast") {
                            return (
                                <div
                                    key={key}
                                    className={`trd-toast trd-toast--${it.heading} trd-t--${it.dep.type}`}
                                    {...hoverProps(key)}
                                >
                                    <VehicleIcon className="trd-toast-icon" />
                                    <span>
                                        {fillTemplate(L.minutes, {
                                            n: Math.ceil(it.state.secondsToNext / 60),
                                        })}
                                    </span>
                                </div>
                            );
                        }
                        return (
                            <div
                                key={`${key}-${it.state.vehicleKey}`}
                                className={`trd-dv trd-dv--${it.heading} trd-t--${it.dep.type}${
                                    it.state.phase === "atStation" ? " trd-dv--arrived" : ""
                                }`}
                                style={{
                                    top: `${it.pos}%`,
                                    opacity: it.state.vehicleOpacity,
                                    "--vehicle-glide": `${VEHICLE_GLIDE_MS}ms`,
                                }}
                                {...hoverProps(key)}
                            >
                                <VehicleIcon className="trd-dv-icon" />
                            </div>
                        );
                    })}
                </div>

                {hovered && <Tip dep={hovered.dep} pos={hovered.pos} t={t} />}
            </div>

            {bottom.length > 0 && (
                <EndBlock
                    group={bottom}
                    side="bottom"
                    isBus={isBus}
                    minutesOnly={minutesOnly}
                    t={t}
                />
            )}
        </section>
    );
}
