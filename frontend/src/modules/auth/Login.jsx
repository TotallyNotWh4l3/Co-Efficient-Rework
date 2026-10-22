
// ===================================================
// ファイル名: Login.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ログインコンポーネント
// ===================================================

import { useState } from "react";
import { useAuth } from "./useAuth";
import { useLanguage } from "../settings/useLanguage";
import "./login.css";

export default function Login() {
    const { login } = useAuth();
    const t = useLanguage().auth.login;

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

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
            <form className="login__card" onSubmit={handleSubmit}>
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
        </main>
    );
}
