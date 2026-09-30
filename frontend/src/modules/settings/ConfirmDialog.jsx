// ===================================================
// ファイル名: ConfirmDialog.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 確認ダイアログ コンポーネント
// ===================================================

import Settings from "./components/SettingsComponents";
import { useLanguage } from "./useLanguage";
import "./confirm-dialog.css";

export default function ConfirmDialog({
    title,
    description,

    confirmText,
    cancelText,

    danger = false,

    onConfirm,
    onClose,
}) {
    const { common } = useLanguage();

    return (
        <div className="confirm-dialog">
            <Settings.Title>{title}</Settings.Title>

            <Settings.Description>{description}</Settings.Description>

            <Settings.Divider />

            <Settings.Row>
                <Settings.Button variant="secondary" onClick={onClose}>
                    {cancelText ?? common.cancel}
                </Settings.Button>

                <Settings.Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>
                    {confirmText ?? common.confirm}
                </Settings.Button>
            </Settings.Row>
        </div>
    );
}
