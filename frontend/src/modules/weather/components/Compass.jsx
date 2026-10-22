// ===================================================
// ファイル名: Compass.jsx
// 作成日: 2026/10/21
// 概要: 風向・風速コンパス（風が吹いてくる方位を縁のマーカーで表示）
//       外周アークが風速（と瞬間風速）を 0〜20 m/s で表し、針は向きへスイングする。
// ===================================================

const MAJOR = [
    [0, "N"],
    [90, "E"],
    [180, "S"],
    [270, "W"],
];

// m/s at which the speed arc closes the full ring.
const MAX_SPEED = 20;

const frac = (v) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v / MAX_SPEED)) : null);

export default function Compass({ degrees, speed, gust, unit = "m/s" }) {
    const hasDir = Number.isFinite(degrees);
    const speedFrac = frac(speed);
    const gustFrac = frac(gust);

    return (
        <svg className="wxp-compass" viewBox="0 0 200 200" role="img">
            <circle className="wxp-compass__ring" cx="100" cy="100" r="86" />

            {gustFrac !== null && (
                <circle
                    className="wxp-compass__arc wxp-compass__arc--gust"
                    cx="100"
                    cy="100"
                    r="86"
                    pathLength="1"
                    transform="rotate(-90 100 100)"
                    style={{ "--f": gustFrac }}
                />
            )}
            {speedFrac !== null && (
                <circle
                    className="wxp-compass__arc"
                    cx="100"
                    cy="100"
                    r="86"
                    pathLength="1"
                    transform="rotate(-90 100 100)"
                    style={{ "--f": speedFrac }}
                />
            )}

            {Array.from({ length: 36 }, (_, i) => {
                const len = i % 9 === 0 ? 10 : i % 3 === 0 ? 7 : 4;
                return (
                    <line
                        key={i}
                        className="wxp-compass__tick"
                        x1="100"
                        x2="100"
                        y1="14"
                        y2={14 + len}
                        transform={`rotate(${i * 10} 100 100)`}
                    />
                );
            })}

            {MAJOR.map(([deg, label]) => {
                const rad = (deg * Math.PI) / 180;
                return (
                    <text
                        key={label}
                        className="wxp-compass__label"
                        x={100 + 64 * Math.sin(rad)}
                        y={100 - 64 * Math.cos(rad) + 4}
                        textAnchor="middle"
                    >
                        {label}
                    </text>
                );
            })}

            {hasDir && (
                <g className="wxp-compass__needle" style={{ "--deg": `${degrees}deg` }}>
                    <polygon className="wxp-compass__marker" points="91,8 109,8 100,32" />
                    <line className="wxp-compass__shaft" x1="100" x2="100" y1="36" y2="72" />
                    <line className="wxp-compass__shaft" x1="100" x2="100" y1="134" y2="164" />
                </g>
            )}

            <text className="wxp-compass__speed" x="100" y="108" textAnchor="middle">
                {Number.isFinite(speed) ? speed.toFixed(1) : "--"}
            </text>
            <text className="wxp-compass__unit" x="100" y="126" textAnchor="middle">
                {unit}
            </text>
        </svg>
    );
}
