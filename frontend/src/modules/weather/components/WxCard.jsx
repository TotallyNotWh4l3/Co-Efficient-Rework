// ===================================================
// ファイル名: WxCard.jsx
// 作成日: 2026/10/27
// 概要: 天気ページ共通のカード枠（タイトル + 中身）。旧 WeatherPage.jsx 内の Card を分離。
//       onOpen を渡すとカード全体が計器タイルと同じようにクリックで詳細を開く。
// ===================================================

export default function WxCard({ title, children, className = "", onOpen }) {
    const tap = onOpen
        ? {
              role: "button",
              tabIndex: 0,
              "aria-haspopup": "dialog",
              onClick: onOpen,
              onKeyDown: (e) => (e.key === "Enter" || e.key === " ") && onOpen(),
          }
        : null;
    return (
        <section
            className={["wxp-card", className, onOpen && "wxp-card--tap"].filter(Boolean).join(" ")}
            {...tap}
        >
            <h3 className="wxp-card__title">{title}</h3>
            {children}
        </section>
    );
}
