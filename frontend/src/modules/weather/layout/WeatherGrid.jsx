// ===================================================
// ファイル名: WeatherGrid.jsx
// 作成日: 2026/10/27
// 概要: 天気ページのモジュールグリッド（ダッシュボードの DashboardWorkspace 相当）
//       各モジュールを col/row/w/h のセルに明示配置する。
//       編集モード中は WeatherEditLayer（移動・リサイズ・設定の枠）を最前面に重ねる。
//       編集用の状態はその枠側だけが持つので、ドラッグ中にモジュール本体は再描画されない。
// ===================================================

import WeatherEditLayer from "./WeatherEditLayer";

// A module at least this many cells wide spans the full row in the stacked
// (narrow window) layout; narrower ones sit two to a row.
const WIDE_FROM = 6;

export default function WeatherGrid({ layout, editing, renderModule, edit }) {
    const { columns, rows, items } = layout;

    return (
        <div
            className={`wxp-workspace${editing ? " is-editing" : ""}`}
            style={{ "--wx-cols": columns, "--wx-rows": rows }}
        >
            {items.map((item, index) => (
                <div
                    key={item.id}
                    className="wxp-cell"
                    data-type={item.type}
                    data-wide={item.w >= WIDE_FROM ? "" : undefined}
                    style={{
                        "--col-start": item.col + 1,
                        "--row-start": item.row + 1,
                        "--col-span": item.w,
                        "--row-span": item.h,
                        // reading order, used only by the stacked layout
                        "--order": item.row * columns + item.col,
                        "--enter-delay": `${Math.min(index, 24) * 35}ms`,
                    }}
                >
                    {renderModule(item)}
                </div>
            ))}

            {editing && <WeatherEditLayer layout={layout} {...edit} />}
        </div>
    );
}
