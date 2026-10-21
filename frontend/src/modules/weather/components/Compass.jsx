// ===================================================
// ファイル名: Compass.jsx
// 作成日: 2026/10/21
// 概要: 風向・風速コンパス（風が吹いてくる方位を縁のマーカーで表示）
// ===================================================

const MAJOR = [
    [0, "N"],
    [90, "E"],
    [180, "S"],
    [270, "W"],
];

export default function Compass({ degrees, speed, unit = "m/s" }) {
    const hasDir = Number.isFinite(degrees);

    return (
        <svg className="wxp-compass" viewBox="0 0 200 200" role="img">
            <circle className="wxp-compass__ring" cx="100" cy="100" r="86" />

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
                <g transform={`rotate(${degrees} 100 100)`}>
                    <polygon className="wxp-compass__marker" points="91,8 109,8 100,32" />
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
