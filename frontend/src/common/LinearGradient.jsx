// ===================================================
// ファイル名: LinearGradient.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 線形グラデーションコンポーネント
// ===================================================


export default function LinearGradient({ gradient, children, style }) {
    const [direction, colors] = gradient;

    return (
        <span
            style={{
                background: `linear-gradient(${direction}, ${colors})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                ...style,
            }}
        >
            {children}
        </span>
    );
}
