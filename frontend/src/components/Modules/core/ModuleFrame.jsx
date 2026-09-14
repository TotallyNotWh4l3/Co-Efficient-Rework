
// ===================================================
// ファイル名: ModuleFrame.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: モジュールフレームコンポーネント
// ===================================================

import "./module-frame.css";

export default function ModuleFrame({ title, children }) {
    return (
        <section className="module-frame">
            <header className="module-frame__header">{title}</header>

            <div className="module-frame__content">{children}</div>
        </section>
    );
}
    