// ===================================================
// ファイル名: Sparkline.jsx
// 作成日: 2026/10/21
// 概要: 計器タイル／ヒーロー背景用の極小SVG折れ線（現在時刻マーカー付き）
//       色は currentColor を使うため、親の CSS (color) で指定する。
// ===================================================

const W = 100;
const H = 30;
const PAD = 3;

/**
 * @param {(number|null)[]} values — evenly spaced samples (null = gap)
 * @param {number} [nowIndex] — index of "now" (-1 = none)
 * @param {boolean} [area] — fill under the line
 * @param {boolean} [dot] — draw the "now" dot (turn off when stretched)
 */
export default function Sparkline({
    values = [],
    nowIndex = -1,
    area = false,
    dot = true,
    className = "",
}) {
    const finite = values.filter(Number.isFinite);
    if (finite.length < 2) return null;

    let min = Math.min(...finite);
    let max = Math.max(...finite);
    if (min === max) {
        min -= 1;
        max += 1;
    }

    const n = values.length;
    const xAt = (i) => (i / (n - 1)) * W;
    const yAt = (v) => H - PAD - ((v - min) / (max - min)) * (H - 2 * PAD);

    let line = "";
    let fill = "";
    let run = [];
    const flush = () => {
        if (run.length > 1) {
            run.forEach((i, k) => {
                line += `${k === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${yAt(values[i]).toFixed(1)}`;
            });
            const first = xAt(run[0]).toFixed(1);
            const last = xAt(run[run.length - 1]).toFixed(1);
            fill += `M${first},${H}`;
            run.forEach((i) => {
                fill += `L${xAt(i).toFixed(1)},${yAt(values[i]).toFixed(1)}`;
            });
            fill += `L${last},${H}Z`;
        }
        run = [];
    };
    values.forEach((v, i) => {
        if (Number.isFinite(v)) run.push(i);
        else flush();
    });
    flush();

    const nowOk = nowIndex >= 0 && nowIndex < n && Number.isFinite(values[nowIndex]);
    const nx = nowOk ? xAt(nowIndex) : 0;
    const ny = nowOk ? yAt(values[nowIndex]) : 0;

    return (
        <svg
            className={`wxp-spark ${className}`}
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            aria-hidden="true"
        >
            {area && <path className="wxp-spark__area" d={fill} />}
            {nowOk && (
                <line
                    className="wxp-spark__now"
                    x1={nx}
                    x2={nx}
                    y1="0"
                    y2={H}
                    vectorEffect="non-scaling-stroke"
                />
            )}
            <path className="wxp-spark__line" d={line} vectorEffect="non-scaling-stroke" />
            {nowOk && dot && (
                <line
                    className="wxp-spark__dot"
                    x1={nx}
                    x2={nx}
                    y1={ny}
                    y2={ny}
                    vectorEffect="non-scaling-stroke"
                />
            )}
        </svg>
    );
}
