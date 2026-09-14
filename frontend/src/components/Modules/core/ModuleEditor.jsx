
// ===================================================
// ファイル名: ModuleEditor.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: モジュールエディタコンポーネント
// ===================================================

import { useDashboard } from "../../../hooks/useDashboard";

export default function ModuleEditor({ module }) {
    const { updateModuleSettings } = useDashboard();

    return (
        <div>
            <label>Title</label>

            <input
                value={module.settings.title ?? ""}
                onChange={(e) => updateModuleSettings(module.id, "title", e.target.value)}
            />

            {module.type === "weather" && (
                <>
                    <label>City</label>

                    <input
                        value={module.settings.city ?? ""}
                        onChange={(e) => updateModuleSettings(module.id, "city", e.target.value)}
                    />

                    <label>Forecast days: {module.settings.forecastDays ?? 3}</label>

                    <input
                        type="range"
                        min="1"
                        max="7"
                        value={module.settings.forecastDays ?? 3}
                        onChange={(e) =>
                            updateModuleSettings(module.id, "forecastDays", Number(e.target.value))
                        }
                    />
                </>
            )}
        </div>
    );
}
