
// ===================================================
// ファイル名: ModuleManager.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: モジュールマネージャーコンポーネント
// ===================================================

import { useDashboard } from "../../../hooks/useDashboard";
import { useSettings } from "../../../hooks/useSettings";

const AVAILABLE_MODULES = [
    {
        type: "weather",
        name: "Weather",
    },
    {
        type: "schedule",
        name: "Schedule",
    },
    {
        type: "announcement",
        name: "Announcements",
    },
];

export default function ModuleManager() {
    const { dashboard, addModule, removeModule } = useDashboard();
    const { settings } = useSettings();

    return (
        <div>
            <h3>Add Module</h3>

            {AVAILABLE_MODULES.map((module) => (
                <button
                    key={module.type}
                    onClick={() =>
                        addModule(module.type, settings.moduleDefaults[module.type] ?? {})
                    }
                >
                    Add {module.name}
                </button>
            ))}

            <h3>Current Modules</h3>

            {dashboard.modules.map((module) => (
                <div key={module.id}>
                    {module.type}

                    <button onClick={() => removeModule(module.id)}>Remove</button>
                </div>
            ))}
        </div>
    );
}
