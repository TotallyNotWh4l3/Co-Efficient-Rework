
// ===================================================
// ファイル名: Login.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ログインコンポーネント
// ===================================================

import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { useLanguage } from "../settings/useLanguage";
import { getDevUsers } from "./authService";
import DevQuickLogin from "./DevQuickLogin";
import "./login.css";

export default function Login() {
    const { login } = useAuth();
    const t = useLanguage().auth.login;

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    // null = quick-login disabled on the backend (DEV_QUICK_LOGIN not true),
    // in which case nothing dev-related is rendered at all.
    const [devUsers, setDevUsers] = useState(null);

    useEffect(() => {
        getDevUsers().then(setDevUsers);
    }, []);

    async function handleSubmit(event) {
        event.preventDefault();

        setError("");

        try {
            await login(username, password);
        } catch (error) {
            setError(error.message);
        }
    }

    return (
        <main className="login">
            <div className="login__card">
                <form className="login__form" onSubmit={handleSubmit}>
                    <h1 className="login__title">Co:Efficient</h1>

                    <input
                        className="login__input"
                        type="text"
                        placeholder={t.username}
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                    />

                    <input
                        className="login__input"
                        type="password"
                        placeholder={t.password}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                    />

                    {error && <div className="login__error">{error}</div>}

                    <button className="login__button" type="submit">
                        {t.submit}
                    </button>
                </form>

                {devUsers && <DevQuickLogin users={devUsers} onError={setError} />}
            </div>
        </main>
    );
}
