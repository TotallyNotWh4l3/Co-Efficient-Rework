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

    return (
        <div
            className="dashboard__workspace"
            style={{
                "--workspace-columns": columnCount,
                "--workspace-gap": `${dashboard.layout.gap}px`,
                "--workspace-padding": `${dashboard.layout.padding}px`,
            }}
        >
            {dashboard.modules.map((module) => (
                <div
                    className="dashboard__cell"
                    key={module.id}
                    style={{
                        "--module-col-span": module.layout?.w ?? 1,
                        "--module-row-span": module.layout?.h ?? 1,
                    }}
                >
                    <ModuleRenderer module={module} onSelect={selectModule} />
                </div>
            ))}
        </div>
    );
}
