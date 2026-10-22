
// ===================================================
// ファイル名: SetPasswordDialog.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: パスワード設定ダイアログ コンポーネント
// ===================================================

import { useState } from "react";
import Settings from "./components/SettingsComponents";
import { useLanguage } from "./useLanguage";

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
            setError(t.validationErrorLength);
            return;
        }
        if (password !== confirmPassword) {
            setError(t.validationErrorMismatch);
            return;
        }

        setSaving(true);
        try {
            await onConfirm(password);
        } catch (err) {
            setError(err.response?.data?.message || err.message || t.genericError);
            setSaving(false);
        }
    };

    return (
        <form className="confirm-dialog" onSubmit={handleSubmit}>
            <Settings.Title>{t.title}</Settings.Title>
            <Settings.Description>
                {t.description.replace("{username}", username)}
            </Settings.Description>

            <Settings.Divider />

            <Settings.Row>
                <Settings.RowContent>
                    <Settings.RowLabel>{t.newPasswordLabel}</Settings.RowLabel>
                </Settings.RowContent>
                <Settings.TextInput
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.newPasswordPlaceholder}
                    autoFocus
                />
            </Settings.Row>

            <Settings.Row>
                <Settings.RowContent>
                    <Settings.RowLabel>
                        {t.confirmPasswordLabel}
                    </Settings.RowLabel>
                </Settings.RowContent>
                <Settings.TextInput
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t.confirmPasswordPlaceholder}
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
                    {t.cancel}
                </Settings.Button>
                <Settings.Button type="submit" disabled={saving}>
                    {saving ? (t.submitting) : (t.submit)}
                </Settings.Button>
            </Settings.Row>
        </form>
    );
}
