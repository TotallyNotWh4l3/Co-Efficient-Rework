// ===================================================
// ファイル名: DashboardWorkspace.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ダッシュボードワークスペースコンポーネント
// ===================================================

import { useDashboard } from "./useDashboard";
import ModuleRenderer from "../../common/ModuleHost/ModuleRenderer";
import "./dashboard-workspace.css";

export default function DashboardWorkspace() {
    const { dashboard, selectModule } = useDashboard();
    const columnCount = dashboard.layout.columns;
    const rowCount = dashboard.layout.rows ?? 4;

    return (
        <div
            className="dashboard__workspace"
            style={{
                "--workspace-columns": columnCount,
                "--workspace-rows": rowCount,
                "--workspace-gap": `${dashboard.layout.gap}px`,
                "--workspace-padding": `${dashboard.layout.padding}px`,
            }}
        >
            {dashboard.modules.map((module) => {
                // cell_index is the module's top-left cell, row-major,
                // 0-based (see Dashboard.js on the backend). Translate it
                // into a 1-based CSS grid-column/row start rather than
                // relying on array order, so a module renders at the exact
                // cell it's assigned to — any cell no module's
                // start+span reaches over is left as an empty grid track,
                // i.e. an invisible placeholder.
                const cellIndex = module.cellIndex ?? 0;
                const colStart = (cellIndex % columnCount) + 1;
                const rowStart = Math.floor(cellIndex / columnCount) + 1;

                return (
                    <div
                        className="dashboard__cell"
                        key={module.id}
                        style={{
                            "--module-col-start": colStart,
                            "--module-row-start": rowStart,
                            "--module-col-span": module.layout?.w ?? 1,
                            "--module-row-span": module.layout?.h ?? 1,
                        }}
                    >
                        <ModuleRenderer module={module} onSelect={selectModule} />
                    </div>
                );
            })}
        </div>
    );
}
