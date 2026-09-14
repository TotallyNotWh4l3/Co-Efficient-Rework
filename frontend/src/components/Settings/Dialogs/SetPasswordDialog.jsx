
// ===================================================
// ファイル名: SetPasswordDialog.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: パスワード設定ダイアログ コンポーネント
// ===================================================

import { useState } from "react";
import Settings from "../Components/SettingsComponents";
import { useLanguage } from "../../../hooks/useLanguage";

export default function SetPasswordDialog({ username, onConfirm, onClose }) {
    const T = useLanguage();
    const t = T?.settings?.users?.setPassword ?? {};

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (password.length < 8) {
            setError(t.validationErrorLength ?? "Password must be at least 8 characters.");
            return;
        }
        if (password !== confirmPassword) {
            setError(t.validationErrorMismatch ?? "Passwords do not match.");
            return;
        }

        setSaving(true);
        try {
            await onConfirm(password);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    err.message ||
                    t.genericError ||
                    "Failed to update password.",
            );
            setSaving(false);
        }
    };

    return (
        <form className="confirm-dialog" onSubmit={handleSubmit}>
            <Settings.Title>{t.title ?? "Set Password"}</Settings.Title>
            <Settings.Description>
                {(
                    t.description ??
                    'Set a new password for "{username}". They\'ll need to use it next time they log in.'
                ).replace("{username}", username)}
            </Settings.Description>

            <Settings.Divider />

            <Settings.Row>
                <Settings.RowContent>
                    <Settings.RowLabel>{t.newPasswordLabel ?? "New Password"}</Settings.RowLabel>
                </Settings.RowContent>
                <Settings.TextInput
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.newPasswordPlaceholder ?? "At least 8 characters"}
                    autoFocus
                />
            </Settings.Row>

            <Settings.Row>
                <Settings.RowContent>
                    <Settings.RowLabel>
                        {t.confirmPasswordLabel ?? "Confirm Password"}
                    </Settings.RowLabel>
                </Settings.RowContent>
                <Settings.TextInput
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t.confirmPasswordPlaceholder ?? "Re-enter password"}
                />
            </Settings.Row>

            {error && <p className="user-mgmt-settings__error">{error}</p>}

            <Settings.Divider />

            <Settings.Row>
                <Settings.Button
                    type="button"
                    variant="secondary"
                    onClick={onClose}
                    disabled={saving}
                >
                    {t.cancel ?? "Cancel"}
                </Settings.Button>
                <Settings.Button type="submit" disabled={saving}>
                    {saving ? (t.submitting ?? "Saving…") : (t.submit ?? "Set Password")}
                </Settings.Button>
            </Settings.Row>
        </form>
    );
}
