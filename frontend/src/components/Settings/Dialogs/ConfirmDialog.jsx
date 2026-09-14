// ===================================================
// ファイル名: ConfirmDialog.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 確認ダイアログ コンポーネント
// ===================================================

import Settings from "../Components/SettingsComponents";
import "./confirm-dialog.css";

export default function ConfirmDialog({
    title,
    description,

    confirmText = "Confirm",
    cancelText = "Cancel",

    danger = false,

    onConfirm,
    onClose,
}) {
    return (
        <div className="confirm-dialog">
            <Settings.Title>{title}</Settings.Title>

            <Settings.Description>{description}</Settings.Description>

            <Settings.Divider />

            <Settings.Row>
                <Settings.Button variant="secondary" onClick={onClose}>
                    {cancelText}
                </Settings.Button>

                <Settings.Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>
                    {confirmText}
                </Settings.Button>
            </Settings.Row>
        </div>
    );
}
