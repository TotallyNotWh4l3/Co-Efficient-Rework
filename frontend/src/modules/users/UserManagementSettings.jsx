
// ===================================================
// ファイル名: UserManagementSettings.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ユーザー管理設定ページ コンポーネント
// ===================================================

import { useState } from "react";
import { Users, Trash2, KeyRound } from "lucide-react";

import "./user-management-settings.css";

import useUsers from "./useUsers";
import { useAuth } from "../auth/useAuth";
import { useLanguage } from "../settings/useLanguage";

import Settings from "../settings/components/SettingsComponents";
import SetPasswordDialog from "../settings/SetPasswordDialog";

export default function UserManagementSettings() {
    const { users, isLoading, error, createUser, updateUserRole, updateUserPassword, deleteUser } =
        useUsers();
    const { user: currentUser } = useAuth();

    const T = useLanguage();
    const copy = T?.settings?.users ?? {};
    const roleLabels = copy.roles ?? { user: "User", manager: "Manager", admin: "Admin" };
    const passwordCopy = copy.setPassword ?? {};

    const ROLE_OPTIONS = [
        { id: "user", label: roleLabels.user },
        { id: "manager", label: roleLabels.manager },
        { id: "admin", label: roleLabels.admin },
    ];

    const [form, setForm] = useState({ username: "", password: "", role: "user" });
    const [formError, setFormError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [passwordDialogUser, setPasswordDialogUser] = useState(null);
    const [passwordToast, setPasswordToast] = useState("");

    const handleCreate = async (e) => {
        e.preventDefault();
        setFormError(null);

        if (!form.username.trim() || !form.password) {
            setFormError(copy.addUser?.validationError);
            return;
        }

        setSubmitting(true);
        try {
            await createUser(form);
            setForm({ username: "", password: "", role: "user" });
        } catch (err) {
            setFormError(err.response?.data?.message || copy.addUser.genericError);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id, username) => {
        const confirmText = copy.delete.confirm.replace("{username}", username);
        if (!window.confirm(confirmText)) return;
        try {
            await deleteUser(id);
        } catch (err) {
            alert(err.response?.data?.message || copy.delete.genericError);
        }
    };

    const handleSetPassword = async (password) => {
        await updateUserPassword(passwordDialogUser.id, password);
        const username = passwordDialogUser.username;
        setPasswordDialogUser(null);
        setPasswordToast(
            passwordCopy.successToast.replace(
                "{username}",
                username,
            ),
        );
        setTimeout(() => setPasswordToast(""), 3000);
    };

    return (
        <div className="user-mgmt-settings">
            <Settings.Title Icon={Users}>{copy.title}</Settings.Title>
            <Settings.Description>
                {copy.description}
            </Settings.Description>

            <Settings.Divider mod="thick" />

            <Settings.Section>
                <Settings.SectionTitle>{copy.addUser?.title}</Settings.SectionTitle>

                <form onSubmit={handleCreate} className="user-mgmt-settings__form">
                    <Settings.Row>
                        <Settings.RowContent>
                            <Settings.RowLabel>
                                {copy.addUser?.usernameLabel}
                            </Settings.RowLabel>
                        </Settings.RowContent>
                        <Settings.TextInput
                            value={form.username}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                            placeholder={copy.addUser?.usernamePlaceholder}
                        />
                    </Settings.Row>

                    <Settings.Row>
                        <Settings.RowContent>
                            <Settings.RowLabel>
                                {copy.addUser?.passwordLabel}
                            </Settings.RowLabel>
                        </Settings.RowContent>
                        <Settings.TextInput
                            type="password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            placeholder={copy.addUser?.passwordPlaceholder}
                        />
                    </Settings.Row>

                    <Settings.Row className="settings__row--stacked">
                        <Settings.RowContent>
                            <Settings.RowLabel>
                                {copy.addUser?.roleLabel}
                            </Settings.RowLabel>
                        </Settings.RowContent>
                        <Settings.Select
                            options={ROLE_OPTIONS}
                            value={form.role}
                            onChange={(e) => setForm({ ...form, role: e.target.value })}
                        />
                    </Settings.Row>

                    {formError && <p className="user-mgmt-settings__error">{formError}</p>}

                    <Settings.Button type="submit" disabled={submitting}>
                        {submitting
                            ? (copy.addUser?.submitting)
                            : (copy.addUser?.submit)}
                    </Settings.Button>
                </form>
            </Settings.Section>

            <Settings.Divider />

            <Settings.Section>
                <Settings.SectionTitle>{copy.allUsers?.title}</Settings.SectionTitle>

                {passwordToast && (
                    <Settings.Description className="user-mgmt-settings__toast">
                        {passwordToast}
                    </Settings.Description>
                )}

                {isLoading ? (
                    <Settings.Description>
                        {copy.allUsers?.loading}
                    </Settings.Description>
                ) : error ? (
                    <Settings.Description>{error}</Settings.Description>
                ) : (
                    users.map((u) => (
                        <Settings.Row key={u.id}>
                            <Settings.RowContent>
                                <Settings.RowLabel>{u.username}</Settings.RowLabel>
                                <Settings.RowDescription>
                                    {(copy.allUsers?.joined).replace(
                                        "{date}",
                                        new Date(u.created_at).toLocaleDateString(),
                                    )}
                                </Settings.RowDescription>
                            </Settings.RowContent>

                            <Settings.Select
                                options={ROLE_OPTIONS}
                                value={u.role}
                                disabled={u.id === currentUser?.id}
                                onChange={(e) => updateUserRole(u.id, e.target.value)}
                            />

                            <button
                                className="user-mgmt-settings__password-btn"
                                onClick={() => setPasswordDialogUser(u)}
                                title={passwordCopy.buttonTitle}
                            >
                                <KeyRound size={16} />
                            </button>

                            <button
                                className="user-mgmt-settings__delete-btn"
                                disabled={u.id === currentUser?.id}
                                onClick={() => handleDelete(u.id, u.username)}
                                title={copy.delete?.title}
                            >
                                <Trash2 size={16} />
                            </button>
                        </Settings.Row>
                    ))
                )}
            </Settings.Section>

            {passwordDialogUser && (
                <SetPasswordDialog
                    username={passwordDialogUser.username}
                    onConfirm={handleSetPassword}
                    onClose={() => setPasswordDialogUser(null)}
                />
            )}
        </div>
    );
}
