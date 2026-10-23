// ===================================================
// ファイル名: TimeSeries.jsx
// 作成日: 2026/10/21
// 概要: 天気ページ用の軽量SVG時系列チャート
//       （折れ線・棒、左右2軸、現在時刻マーカー、ホバー読み取り＋ツールチップ、
//        グラデーション塗り・最高/最低ラベル・描画アニメーション）
//       凡例クリックで系列の表示/非表示、ドラッグ範囲選択でズーム（ダブルクリックで解除）。
//       親要素のサイズに合わせてSVGを描画する（スクロール不要のレイアウト用）。
//       負にならない系列（nonNegative）は、全値が0のとき軸を 0〜1 にして線を最下部に置く。
//       2026/10/23: ・左右の余白を目盛り文字の幅に合わせて縮小（グラフが潰れないように）
//                   ・系列の表示/非表示を切り替えても軸の最大/最小を変えない
//                   ・範囲変更（7日→48時間など）やドラッグズームで、表示範囲外の
//                     データを消さずに全データを描画したままビューポートを滑らかに
//                     アニメーションさせる（X範囲・Y軸の両方をイージング）
// ===================================================

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

const DEFAULT_W = 800;
const DEFAULT_H = 220;
const PAD_T = 12;
const PAD_B = 24;
const PAD_MIN = 8; // side margin when that axis has no labels
const TICK_CHAR_W = 6.2; // width of one 10px monospace tick-label glyph
const RETRACT_MS = 420;
const VIEW_MS = 600; // viewport (range / zoom) transition
const easeOut = (p) => 1 - (1 - p) ** 3;
const lerp = (a, b, e) => a + (b - a) * e;

// Margin an axis needs for its tick labels (+ the 6px gap to the plot).
const labelPad = (scale) =>
    scale
        ? Math.ceil(Math.max(...scale.ticks.map((t) => String(t).length), 1) * TICK_CHAR_W) + 8
        : PAD_MIN;

function niceScale(min, max, count = 4) {
    let lo = min;
    let hi = max;
    if (lo === hi) {
        lo -= 1;
        hi += 1;
    }
    const raw = (hi - lo) / count;
    const mag = 10 ** Math.floor(Math.log10(raw));
    const norm = raw / mag;
    const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
    const start = Math.floor(lo / step) * step;
    const end = Math.ceil(hi / step) * step;
    const ticks = [];
    for (let v = start; v <= end + step / 2; v += step) ticks.push(+v.toFixed(10));
    return { lo: start, hi: end, ticks };
}

function buildScale(seriesOnAxis, fixed) {
    if (fixed) {
        const { ticks } = niceScale(fixed[0], fixed[1]);
        return {
            lo: fixed[0],
            hi: fixed[1],
            ticks: ticks.filter((t) => t >= fixed[0] && t <= fixed[1]),
        };
    }
    const values = seriesOnAxis.flatMap((s) => s.values).filter((v) => Number.isFinite(v));
    if (values.length === 0) return null;
    let min = Math.min(...values);
    let max = Math.max(...values);
    if (seriesOnAxis.some((s) => s.kind === "bar")) min = Math.min(0, min);

    // Quantities that can never be negative (CAPE, UV, wind, ...): a flat-zero
    // series sits on the bottom of a 0..1 axis instead of floating mid-chart.
    if (seriesOnAxis.length > 0 && seriesOnAxis.every((s) => s.nonNegative)) {
        if (max <= 0) return niceScale(0, 1, 2);
        const scale = niceScale(Math.max(0, min), max);
        if (scale.lo < 0) {
            return { ...scale, lo: 0, ticks: scale.ticks.filter((t) => t >= 0) };
        }
        return scale;
    }
    return niceScale(min, max);
}

function pathFor(values, xAt, yAt) {
    let d = "";
    let pen = false;
    values.forEach((v, i) => {
        if (!Number.isFinite(v)) {
            pen = false;
            return;
        }
        d += `${pen ? "L" : "M"}${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`;
        pen = true;
    });
    return d;
}

function areaFor(values, xAt, yAt, baseY) {
    let d = "";
    let run = [];
    const flush = () => {
        if (run.length > 1) {
            d += `M${xAt(run[0]).toFixed(1)},${baseY}`;
            run.forEach((i) => {
                d += `L${xAt(i).toFixed(1)},${yAt(values[i]).toFixed(1)}`;
            });
            d += `L${xAt(run[run.length - 1]).toFixed(1)},${baseY}Z`;
        }
        run = [];
    };
    values.forEach((v, i) => {
        if (Number.isFinite(v)) run.push(i);
        else flush();
    });
    flush();
    return d;
}

function pickStride(n, innerW) {
    const labels = Math.max(3, Math.floor(innerW / 44));
    const target = n / labels;
    return [1, 2, 3, 4, 6, 12, 24].find((s) => s >= target) ?? 24;
}

/**
 * @param {string[]} times — location-local ISO strings, one per point
 * @param {Array<{key, label, color, values:(number|null)[], axis?:"left"|"right",
 *   kind?:"line"|"bar", unit?:string, digits?:number, dashed?:boolean,
 *   area?:boolean (gradient fill under the line), extrema?:boolean (label high/low),
 *   nonNegative?:boolean (value can't go below 0 → flat-zero data uses a 0..1 axis)}>} series
 * @param {number} nowIndex — index of "now" within `times` (or -1)
 * @param {number} [viewCount] — how many of the leading points are in view
 *   (default: all). `times`/`series` may hold MORE points than that: the rest
 *   stays mounted just outside the plot, so changing `viewCount` pans/zooms the
 *   viewport smoothly instead of the extra data vanishing.
 * @param {[number, number]} [leftDomain] / [rightDomain] — fixed axis ranges
 */
export default function TimeSeries({
    times,
    series: allSeries,
    nowIndex: fullNow = -1,
    viewCount,
    nowLabel = "NOW",
    leftDomain,
    rightDomain,
    labels = {},
}) {
    const uid = useId().replace(/:/g, "");
    const svgRef = useRef(null);
    const plotRef = useRef(null);
    const [hover, setHover] = useState(null);
    const [off, setOff] = useState(() => new Set());
    const [leaving, setLeaving] = useState(() => new Set()); // hidden, still retracting
    const [zoom, setZoom] = useState(null); // [first, last] absolute indices into `times`
    const [drag, setDrag] = useState(null); // { a, b } absolute indices
    const [size, setSize] = useState({ w: DEFAULT_W, h: DEFAULT_H });

    // Draw at the real pixel size of the container so text stays crisp and the
    // chart can fill whatever height the page layout gives it.
    useEffect(() => {
        const el = plotRef.current;
        if (!el || typeof ResizeObserver === "undefined") return undefined;
        const ro = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            if (width < 40 || height < 40) return;
            setSize((prev) =>
                Math.abs(prev.w - width) < 1 && Math.abs(prev.h - height) < 1
                    ? prev
                    : { w: Math.round(width), h: Math.round(height) },
            );
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // A new window (range button / location change) invalidates the zoom.
    const firstTime = times[0];
    const count = times.length;
    useEffect(() => setZoom(null), [firstTime, count, viewCount]);

    // First ~2.6 s after mount: the series animations wait for the page's
    // staggered card entrance (--enter-delay, see weather-page.css) so a chart
    // draws as its card appears. Afterwards the class is dropped, so series
    // that are toggled back on later don't inherit that delay.
    const [intro, setIntro] = useState(true);
    useEffect(() => {
        const id = setTimeout(() => setIntro(false), 2600);
        return () => clearTimeout(id);
    }, []);

    // ---------- viewport ----------
    // The chart always holds every point it was given; what is *visible* is a
    // viewport [v0, v1] (absolute indices) plus the Y ranges. Range buttons and
    // drag-zoom only change the viewport TARGET; the shown viewport eases
    // towards it, so the data that falls out of range slides out of the plot
    // (it is clipped by the plot edge) instead of disappearing at once.
    const tv0 = zoom ? zoom[0] : 0;
    const tv1 = zoom ? zoom[1] : Math.max(0, Math.min(viewCount ?? count, count) - 1);

    // Axis ranges come from ALL series (shown or not) over the visible window,
    // so toggling a series in the legend never rescales the axes.
    const axisInput = (axis) =>
        allSeries
            .filter((s) => (s.axis ?? "left") === axis)
            .map((s) => ({ ...s, values: s.values.slice(tv0, tv1 + 1) }));
    const tLeft = buildScale(axisInput("left"), leftDomain);
    const tRight = allSeries.some((s) => s.axis === "right")
        ? buildScale(axisInput("right"), rightDomain)
        : null;

    const target = {
        v0: tv0,
        v1: tv1,
        ll: tLeft?.lo ?? 0,
        lh: tLeft?.hi ?? 1,
        rl: tRight?.lo ?? 0,
        rh: tRight?.hi ?? 1,
    };
    const targetKey = Object.values(target).join("|");
    const [view, setView] = useState(target);
    const viewRef = useRef(target); // latest shown values (survives interrupted tweens)
    useEffect(() => {
        const from = viewRef.current;
        const to = target;
        if (Object.keys(to).every((k) => from[k] === to[k])) return undefined;
        const t0 = performance.now();
        let raf = 0;
        const tick = (now) => {
            const p = Math.min(1, (now - t0) / VIEW_MS);
            const e = easeOut(p);
            const cur = {};
            for (const k of Object.keys(to)) cur[k] = p >= 1 ? to[k] : lerp(from[k], to[k], e);
            viewRef.current = cur;
            setView(cur);
            if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
        // `target` is fully described by targetKey
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [targetKey]);

    // Labels / extrema re-fade whenever the TARGET viewport changes. Two
    // identical keyframe sets are swapped so the animation restarts each time.
    const [fadeN, setFadeN] = useState(0);
    const prevView = useRef(`${tv0}|${tv1}`);
    useLayoutEffect(() => {
        const key = `${tv0}|${tv1}`;
        if (prevView.current !== key) {
            prevView.current = key;
            setFadeN((n) => n + 1);
        }
    }, [tv0, tv1]);
    const fadeStyle =
        fadeN === 0 ? undefined : { animationName: `wxp-range-fade-${fadeN % 2 ? "a" : "b"}` };

    // A just-hidden series stays in `series` (flagged `leaving`) until its
    // retract animation is done, so it can play the wipe-out.
    const series = allSeries
        .filter((s) => !off.has(s.key) || leaving.has(s.key))
        .map((s) => ({ ...s, leaving: off.has(s.key) }));
    const live = series.filter((s) => !s.leaving);

    // Scales as currently drawn: eased range, ticks from the target scale.
    const shown = (t, lo, hi) =>
        t
            ? {
                  ...t,
                  lo,
                  hi,
                  ticks: t.ticks.filter(
                      (v) => v >= lo - (hi - lo) * 1e-6 && v <= hi + (hi - lo) * 1e-6,
                  ),
              }
            : null;
    const leftScale = shown(tLeft, view.ll, view.lh);
    const rightScale = shown(tRight, view.rl, view.rh);

    // Side margins hug the tick labels instead of a fixed 46px each.
    const PAD = { l: labelPad(tLeft), r: labelPad(tRight), t: PAD_T, b: PAD_B };

    const W = size.w;
    const H = size.h;
    const INNER_W = Math.max(10, W - PAD.l - PAD.r);
    const INNER_H = Math.max(10, H - PAD.t - PAD.b);

    const span = view.v1 - view.v0 + 1;
    const step = INNER_W / Math.max(span, 1);
    const xAt = (i) => PAD.l + (i - view.v0 + 0.5) * step;

    const yFor = (scale) => (v) =>
        PAD.t + INNER_H - ((v - scale.lo) / (scale.hi - scale.lo || 1)) * INNER_H;

    const scaleOf = (s) => ((s.axis ?? "left") === "left" ? leftScale : rightScale);

    function indexAt(e) {
        const rect = svgRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * W;
        return Math.min(tv1, Math.max(tv0, Math.floor((x - PAD.l) / step + view.v0)));
    }

    function handleMove(e) {
        if (count === 0) return;
        const i = indexAt(e);
        setHover(i);
        if (drag) setDrag({ ...drag, b: i });
    }

    function handleDown(e) {
        if (count === 0 || e.button !== 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        const i = indexAt(e);
        setDrag({ a: i, b: i });
    }

    function handleUp() {
        if (drag && Math.abs(drag.b - drag.a) >= 3) {
            setZoom([Math.min(drag.a, drag.b), Math.max(drag.a, drag.b)]);
        }
        setDrag(null);
    }

    function toggle(key) {
        const hiding = !off.has(key);
        setOff((prev) => {
            const next = new Set(prev);
            if (hiding) next.add(key);
            else next.delete(key);
            return next;
        });
        setLeaving((prev) => {
            const next = new Set(prev);
            if (hiding) next.add(key);
            else next.delete(key);
            return next;
        });
        if (hiding) {
            setTimeout(
                () =>
                    setLeaving((prev) => {
                        const next = new Set(prev);
                        next.delete(key);
                        return next;
                    }),
                RETRACT_MS,
            );
        }
    }

    // Wipe-reveal clip: dashed lines can't use the dash-offset draw trick, and
    // every series needs it to retract.
    const clipId = (s) => `wxp-${uid}-clip-${s.key}`;
    const clipFor = (s) =>
        s.leaving || (s.dashed && s.kind !== "bar") ? `url(#${clipId(s)})` : undefined;

    const nowVisible = fullNow >= tv0 && fullNow <= tv1;
    const readIdx = hover ?? (nowVisible ? fullNow : tv0);
    const stride = pickStride(tv1 - tv0 + 1, INNER_W);
    const refScale = leftScale ?? rightScale;
    const baseY = PAD.t + INNER_H;
    const lineSeries = series.filter((s) => s.kind !== "bar");
    const areaSeries = lineSeries.filter((s) => s.area);

    // Points worth drawing a label for: the ones near the (moving) viewport.
    const firstIdx = Math.max(0, Math.floor(view.v0) - 1);
    const lastIdx = Math.min(count - 1, Math.ceil(view.v1) + 1);
    const labelIdx = [];
    for (let i = firstIdx; i <= lastIdx; i++) labelIdx.push(i);

    return (
        <div className={`wxp-chart${intro ? " wxp-chart--intro" : ""}`}>
            <div className="wxp-chart__plot" ref={plotRef}>
                <svg
                    ref={svgRef}
                    className="wxp-chart__svg"
                    viewBox={`0 0 ${W} ${H}`}
                    onPointerMove={handleMove}
                    onPointerDown={handleDown}
                    onPointerUp={handleUp}
                    onPointerCancel={() => setDrag(null)}
                    onPointerLeave={() => setHover(null)}
                    onDoubleClick={() => setZoom(null)}
                    role="img"
                >
                    <defs>
                        {areaSeries.map((s) => (
                            <linearGradient
                                key={s.key}
                                id={`wxp-${uid}-${s.key}`}
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="0%"
                                    style={{ stopColor: s.color, stopOpacity: 0.34 }}
                                />
                                <stop
                                    offset="100%"
                                    style={{ stopColor: s.color, stopOpacity: 0 }}
                                />
                            </linearGradient>
                        ))}
                        <clipPath id={`wxp-${uid}-plot`}>
                            <rect x={PAD.l} y={0} width={INNER_W} height={H} />
                        </clipPath>
                        {series.filter(clipFor).map((s) => (
                            <clipPath key={s.key} id={clipId(s)}>
                                <rect
                                    className={`wxp-chart__clip wxp-chart__clip--${s.leaving ? "out" : "in"}`}
                                    x={PAD.l}
                                    y={0}
                                    width={INNER_W}
                                    height={H}
                                />
                            </clipPath>
                        ))}
                    </defs>

                    {/* grid + left axis labels */}
                    {refScale?.ticks.map((t) => {
                        const y = yFor(refScale)(t);
                        return (
                            <g key={`g${t}`}>
                                <line
                                    className="wxp-chart__grid"
                                    x1={PAD.l}
                                    x2={W - PAD.r}
                                    y1={y}
                                    y2={y}
                                />
                                {leftScale && (
                                    <text
                                        className="wxp-chart__tick"
                                        x={PAD.l - 6}
                                        y={y + 3}
                                        textAnchor="end"
                                    >
                                        {t}
                                    </text>
                                )}
                            </g>
                        );
                    })}

                    {/* right axis labels */}
                    {rightScale?.ticks.map((t) => (
                        <text
                            key={`r${t}`}
                            className="wxp-chart__tick"
                            x={W - PAD.r + 6}
                            y={yFor(rightScale)(t) + 3}
                            textAnchor="start"
                        >
                            {t}
                        </text>
                    ))}

                    {/* x labels + midnight separators (fade in after a range change);
                        clipped to the plot so labels slide out with the data */}
                    <g clipPath={`url(#wxp-${uid}-plot)`}>
                        <g className="wxp-chart__fade" style={fadeStyle}>
                            {labelIdx.map((i) => {
                                const t = times[i];
                                const hour = Number(t.slice(11, 13));
                                const midnight = hour === 0;
                                const showLabel = hour % stride === 0;
                                const edge = xAt(i) - step / 2;
                                return (
                                    <g key={t}>
                                        {midnight && i > 0 && edge > PAD.l + 1 && (
                                            <line
                                                className="wxp-chart__day"
                                                x1={edge}
                                                x2={edge}
                                                y1={PAD.t}
                                                y2={PAD.t + INNER_H}
                                            />
                                        )}
                                        {showLabel && (
                                            <text
                                                className="wxp-chart__tick"
                                                x={xAt(i)}
                                                y={H - 7}
                                                textAnchor="middle"
                                            >
                                                {midnight
                                                    ? `${t.slice(5, 7)}/${t.slice(8, 10)}`
                                                    : String(hour).padStart(2, "0")}
                                            </text>
                                        )}
                                    </g>
                                );
                            })}
                        </g>
                    </g>

                    {/* data layer: every point stays mounted; the viewport eases over it */}
                    <g clipPath={`url(#wxp-${uid}-plot)`}>
                        <g>
                            {/* bars first so lines sit on top */}
                            {series
                                .filter((s) => s.kind === "bar")
                                .map((s) => {
                                    const scale = scaleOf(s);
                                    if (!scale) return null;
                                    const y = yFor(scale);
                                    const base = y(Math.max(0, scale.lo));
                                    return (
                                        <g key={s.key} clipPath={clipFor(s)}>
                                            {s.values.map((v, i) =>
                                                Number.isFinite(v) && v > 0 ? (
                                                    <rect
                                                        key={`${s.key}${i}`}
                                                        className="wxp-chart__bar"
                                                        x={xAt(i) - step * 0.35}
                                                        width={step * 0.7}
                                                        y={y(v)}
                                                        height={Math.max(0, base - y(v))}
                                                        style={{
                                                            fill: s.color,
                                                            "--bar-delay": `${Math.round(Math.min(1, Math.max(0, i - tv0) / Math.max(1, tv1 - tv0 + 1)) * 600)}ms`,
                                                        }}
                                                        opacity={s.opacity ?? 0.55}
                                                    />
                                                ) : null,
                                            )}
                                        </g>
                                    );
                                })}

                            {areaSeries.map((s) => {
                                const scale = scaleOf(s);
                                if (!scale) return null;
                                return (
                                    <path
                                        key={`a${s.key}`}
                                        className="wxp-chart__area"
                                        clipPath={clipFor(s)}
                                        d={areaFor(s.values, xAt, yFor(scale), baseY)}
                                        fill={`url(#wxp-${uid}-${s.key})`}
                                    />
                                );
                            })}

                            {lineSeries.map((s) => {
                                const scale = scaleOf(s);
                                if (!scale) return null;
                                return (
                                    <path
                                        key={s.key}
                                        className={`wxp-chart__line${s.dashed ? "" : " wxp-chart__line--draw"}`}
                                        d={pathFor(s.values, xAt, yFor(scale))}
                                        pathLength={s.dashed ? undefined : 1}
                                        clipPath={clipFor(s)}
                                        style={{ stroke: s.color, color: s.color }}
                                        strokeDasharray={s.dashed ? "4 3" : undefined}
                                    />
                                );
                            })}

                            {fullNow >= 0 && fullNow < count && (
                                <line
                                    className="wxp-chart__now"
                                    x1={xAt(fullNow)}
                                    x2={xAt(fullNow)}
                                    y1={PAD.t}
                                    y2={PAD.t + INNER_H}
                                />
                            )}
                        </g>
                    </g>

                    {/* high / low labels */}
                    <g className="wxp-chart__fade" style={fadeStyle}>
                        {lineSeries
                            .filter((s) => s.extrema && !s.leaving)
                            .map((s) => {
                                const scale = scaleOf(s);
                                const finite = [];
                                for (let i = tv0; i <= tv1; i++) {
                                    if (Number.isFinite(s.values[i])) finite.push([s.values[i], i]);
                                }
                                if (!scale || finite.length < 2) return null;
                                const y = yFor(scale);
                                const hi = finite.reduce((a, b) => (b[0] > a[0] ? b : a));
                                const lo = finite.reduce((a, b) => (b[0] < a[0] ? b : a));
                                if (hi[0] === lo[0]) return null;
                                const anchor = (x) =>
                                    x < PAD.l + 24
                                        ? "start"
                                        : x > W - PAD.r - 24
                                          ? "end"
                                          : "middle";
                                return [
                                    [hi, Math.max(PAD.t + 8, y(hi[0]) - 7), "▲"],
                                    [lo, Math.min(baseY - 3, y(lo[0]) + 15), "▼"],
                                ].map(([[v, i], ty, mark]) => (
                                    <text
                                        key={`${s.key}${mark}`}
                                        className="wxp-chart__extreme"
                                        x={xAt(i)}
                                        y={ty}
                                        textAnchor={anchor(xAt(i))}
                                        style={{ fill: s.color }}
                                    >
                                        {mark} {v.toFixed(s.digits ?? 0)}
                                    </text>
                                ));
                            })}
                    </g>

                    {/* value dots at the read-out position */}
                    {count > 0 && (
                        <g clipPath={`url(#wxp-${uid}-plot)`}>
                            {lineSeries.map((s) => {
                                const scale = scaleOf(s);
                                const v = s.values[readIdx];
                                if (s.leaving || !scale || !Number.isFinite(v)) return null;
                                return (
                                    <circle
                                        key={`d${s.key}`}
                                        className="wxp-chart__dot"
                                        cx={xAt(readIdx)}
                                        cy={yFor(scale)(v)}
                                        r="3.5"
                                        style={{ fill: s.color }}
                                    />
                                );
                            })}
                        </g>
                    )}

                    {fullNow >= 0 && fullNow < count && (
                        <g clipPath={`url(#wxp-${uid}-plot)`}>
                            <text
                                className="wxp-chart__now-label wxp-chart__fade"
                                style={fadeStyle}
                                x={xAt(fullNow) + 4}
                                y={PAD.t + 9}
                            >
                                {nowLabel}
                            </text>
                        </g>
                    )}

                    {hover !== null && (
                        <rect
                            className="wxp-chart__band"
                            x={xAt(hover) - step / 2}
                            y={PAD.t}
                            width={step}
                            height={INNER_H}
                        />
                    )}

                    {drag && drag.a !== drag.b && (
                        <rect
                            className="wxp-chart__select"
                            x={xAt(Math.min(drag.a, drag.b)) - step / 2}
                            y={PAD.t}
                            width={(Math.abs(drag.b - drag.a) + 1) * step}
                            height={INNER_H}
                        />
                    )}

                    {hover !== null && (
                        <line
                            className="wxp-chart__cursor"
                            x1={xAt(hover)}
                            x2={xAt(hover)}
                            y1={PAD.t}
                            y2={PAD.t + INNER_H}
                        />
                    )}
                </svg>

                {hover !== null && count > 0 && (
                    <div
                        className={`wxp-chart__tip${xAt(hover) > W * 0.58 ? " is-left" : ""}`}
                        style={{ left: xAt(hover), top: PAD.t + 4 }}
                        role="tooltip"
                    >
                        <div className="wxp-chart__tip-time">
                            {times[hover]?.slice(5, 16).replace("T", " ") ?? "--"}
                        </div>
                        {live.map((s) => {
                            const v = s.values[hover];
                            return (
                                <div key={s.key} className="wxp-chart__tip-row">
                                    <i
                                        className="wxp-chart__swatch"
                                        style={{ background: s.color }}
                                    />
                                    <span>{s.label}</span>
                                    <b>
                                        {Number.isFinite(v) ? v.toFixed(s.digits ?? 0) : "--"}
                                        {s.unit ? <em>{s.unit}</em> : null}
                                    </b>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="wxp-chart__legend">
                {allSeries.map((s) => (
                    <button
                        key={s.key}
                        type="button"
                        className={`wxp-chart__chip${off.has(s.key) ? " is-off" : ""}`}
                        onClick={() => toggle(s.key)}
                        aria-pressed={!off.has(s.key)}
                    >
                        <i className="wxp-chart__swatch" style={{ background: s.color }} />
                        {s.label}
                    </button>
                ))}
                {zoom ? (
                    <button
                        type="button"
                        className="wxp-chart__chip wxp-chart__reset"
                        onClick={() => setZoom(null)}
                    >
                        {labels.resetZoom ?? "Reset zoom"}
                    </button>
                ) : (
                    <span className="wxp-chart__zoomhint">{labels.zoomHint ?? ""}</span>
                )}
            </div>

            <div className="wxp-chart__readout">
                <span className="wxp-chart__readout-time">
                    {times[readIdx]?.replace("T", " ") ?? "--"}
                </span>
                {live.map((s) => {
                    const v = s.values[readIdx];
                    return (
                        <span key={s.key} className="wxp-chart__readout-item">
                            <i className="wxp-chart__swatch" style={{ background: s.color }} />
                            {s.label} <b>{Number.isFinite(v) ? v.toFixed(s.digits ?? 0) : "--"}</b>
                            {s.unit ? <em>{s.unit}</em> : null}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}
