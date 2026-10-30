// ===================================================
// ファイル名: smoothPath.js
// 作成日: 2026/10/30
// 概要: 折れ線グラフ用のSVGパス生成（TimeSeries / Sparkline 共通）。
//       smooth = 0 は従来どおりの直線、1 に近づくほど滑らかな曲線になる。
//       曲線は Catmull-Rom 方式で、制御点のYを隣り合う2点の間に収める。
//       そのため、極大・極小の先で線がはみ出したり、0未満に沈んだりしない。
//       null / NaN の点は途切れ（ギャップ）として扱い、各区間を別々に描く。
// ===================================================

const f = (n) => n.toFixed(1);

// Consecutive finite values -> runs of {x, y} points.
function runsOf(values, xAt, yAt) {
    const runs = [];
    let run = [];
    values.forEach((v, i) => {
        if (Number.isFinite(v)) {
            run.push({ x: xAt(i), y: yAt(v) });
        } else {
            if (run.length > 0) runs.push(run);
            run = [];
        }
    });
    if (run.length > 0) runs.push(run);
    return runs;
}

// Path commands that continue from pts[0] through the rest of the run.
function segments(pts, smooth) {
    let d = "";
    for (let i = 1; i < pts.length; i++) {
        const p1 = pts[i - 1];
        const p2 = pts[i];
        if (smooth <= 0) {
            d += `L${f(p2.x)},${f(p2.y)}`;
            continue;
        }
        const p0 = pts[i - 2] ?? p1;
        const p3 = pts[i + 1] ?? p2;
        const k = smooth / 6;
        const lo = Math.min(p1.y, p2.y);
        const hi = Math.max(p1.y, p2.y);
        const clampY = (y) => Math.min(hi, Math.max(lo, y));
        const c1x = p1.x + (p2.x - p0.x) * k;
        const c1y = clampY(p1.y + (p2.y - p0.y) * k);
        const c2x = p2.x - (p3.x - p1.x) * k;
        const c2y = clampY(p2.y - (p3.y - p1.y) * k);
        d += `C${f(c1x)},${f(c1y)} ${f(c2x)},${f(c2y)} ${f(p2.x)},${f(p2.y)}`;
    }
    return d;
}

/**
 * The line through `values`.
 * @param {(number|null)[]} values
 * @param {(i:number)=>number} xAt — x of point i
 * @param {(v:number)=>number} yAt — y of value v
 * @param {number} [smooth] — 0 (straight) .. 1 (rounded)
 */
export function linePath(values, xAt, yAt, smooth = 0) {
    return runsOf(values, xAt, yAt)
        .map((run) => `M${f(run[0].x)},${f(run[0].y)}${segments(run, smooth)}`)
        .join("");
}

/**
 * The same line closed down to `baseY`, for the gradient fill under it.
 * Runs of a single point have no area, so they are skipped.
 */
export function areaPath(values, xAt, yAt, baseY, smooth = 0) {
    return runsOf(values, xAt, yAt)
        .filter((run) => run.length > 1)
        .map((run) => {
            const first = run[0];
            const last = run[run.length - 1];
            return `M${f(first.x)},${baseY}L${f(first.x)},${f(first.y)}${segments(run, smooth)}L${f(last.x)},${baseY}Z`;
        })
        .join("");
}
