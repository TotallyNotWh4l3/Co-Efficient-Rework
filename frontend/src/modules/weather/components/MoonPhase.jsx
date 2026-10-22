// ===================================================
// ファイル名: MoonPhase.jsx
// 作成日: 2026/10/22
// 概要: 今日の月の形（月相）を大きな円盤で描画する。
//       phase は Open-Meteo の moon_phase（0=新月, 0.5=満月）。
//       南半球では見かけの向きが左右逆になるため flip で反転する。
// ===================================================

const R = 26;

// Lit part of the disc; same construction as SunArc's small moon, scaled to R.
function litPath(phase) {
    const c = Math.cos(2 * Math.PI * phase);
    const waxing = phase < 0.5;
    const crescent = c > 0;
    const rx = (R * Math.abs(c)).toFixed(2);
    const limb = waxing ? 1 : 0;
    const term = waxing === crescent ? 0 : 1;
    return `M0,${-R}A${R},${R} 0 0 ${limb} 0,${R}A${rx},${R} 0 0 ${term} 0,${-R}Z`;
}

export default function MoonPhase({ phase, flip = false, className = "" }) {
    if (!Number.isFinite(phase)) return null;
    return (
        <svg
            className={`wxp-moonphase ${className}`}
            viewBox="-30 -30 60 60"
            role="img"
            style={flip ? { transform: "scaleX(-1)" } : undefined}
        >
            <circle className="wxp-moonphase__dark" r={R} />
            <path className="wxp-moonphase__lit" d={litPath(phase)} />
        </svg>
    );
}
