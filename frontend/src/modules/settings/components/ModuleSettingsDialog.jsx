// ===================================================
// ファイル名: ModuleSettingsDialog.jsx
// 概要: モジュール配置プレビューでモジュールをクリックしたときに開く、
//       そのモジュール固有の設定 (場所・表示形式など) のポップアップ。
//       DialogManager から "moduleSettings" タイプで表示される。
//       設定の変更は即時に保存されるので、保存ボタンはなく「完了」で閉じるだけ。
// ===================================================

import "./module-settings-dialog.css";

import { useEffect } from "react";

import Settings from "./SettingsComponents";
import ModuleSpecificSettings from "./ModuleSpecificSettings";
import { useDashboard } from "../../dashboard/useDashboard";
import { useLanguage } from "../useLanguage";

export default function ModuleSettingsDialog({ moduleId, title, onMove, onClose }) {
    const { dashboard } = useDashboard();
    const T = useLanguage();
    const copy = T?.settings?.modules?.moduleSettings ?? {};

    // Looked up on every render so the form always shows the live settings.
    const module = dashboard.modules?.find((m) => m.id === moduleId);

    // The module can disappear while the dialog is open (removed from another tab).
    useEffect(() => {
        if (!module) onClose();
    }, [module, onClose]);

    if (!module) return null;

    return (
        <div className="module-settings-dialog">
            <Settings.Title>{title}</Settings.Title>

            <Settings.Divider />

            <div className="module-settings-dialog__body">
                <ModuleSpecificSettings module={module} copy={copy} />
            </div>

            <Settings.Divider />

            <Settings.Row>
                {onMove && (
                    <Settings.Button
                        variant="secondary"
                        onClick={() => {
                            onMove();
                            onClose();
                        }}
                    >
                        {copy.move}
                    </Settings.Button>
                )}
                <Settings.Button variant="primary" onClick={onClose}>
                    {copy.done}
                </Settings.Button>
            </Settings.Row>
        </div>
    );
}
