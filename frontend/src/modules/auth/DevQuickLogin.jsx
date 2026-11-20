// ===================================================
// ファイル名: DevQuickLogin.jsx
// 作成日: 2026/11/20
// 概要: 開発専用のクイックログインパネル
//       「管理者でログイン」ボタンと既存ユーザー一覧（パスワード不要）。
//       backend/.env の DEV_QUICK_LOGIN=true のときだけ Login から表示される。
// ===================================================

import { useState } from "react";
import { ShieldCheck, User } from "lucide-react";
import { useAuth } from "./useAuth";
import { useLanguage } from "../settings/useLanguage";
import "./dev-quick-login.css";

export default function DevQuickLogin({ users, onError }) {
    const { devLogin } = useAuth();
    const t = useLanguage().auth.login.dev;
    const [busy, setBusy] = useState(false);

    async function handleLogin(target) {
        if (busy) return;

        setBusy(true);
        onError("");

        try {
            await devLogin(target);
        } catch (error) {
            onError(error.response?.data?.message ?? error.message);
            setBusy(false);
        }
        // On success this screen unmounts (user is set), so no reset needed.
    }

    return (
        <section className="dev-login">
            <div className="dev-login__header">
                <span className="dev-login__badge">{t.badge}</span>
            </div>

            <button
                type="button"
                className="dev-login__admin"
                disabled={busy}
                onClick={() => handleLogin({ role: "admin" })}
            >
                <ShieldCheck size={16} />
                {t.loginAsAdmin}
            </button>

            <div className="dev-login__label">{t.orPick}</div>

            <ul className="dev-login__list">
                {users.map((u) => (
                    <li key={u.id}>
                        <button
                            type="button"
                            className="dev-login__user"
                            disabled={busy}
                            onClick={() => handleLogin({ userId: u.id })}
                        >
                            <User size={14} />
                            <span className="dev-login__username">{u.username}</span>
                            <span className="dev-login__role">{u.role}</span>
                        </button>
                    </li>
                ))}

                {users.length === 0 && <li className="dev-login__empty">{t.noUsers}</li>}
            </ul>
        </section>
    );
}
