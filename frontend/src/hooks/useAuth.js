
// ===================================================
// ファイル名: useAuth.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 認証フック
// ===================================================

import { useState, useEffect, useCallback } from "react";
import { useAuthContext } from "../context/AuthContext";
import * as AuthService from "../services/authService";

export function useAuthState() {
    const [auth, setAuth] = useState({
        user: null,
        token: null,
        loading: true,
    });

    useEffect(() => {
        async function restoreSession() {
            const storedToken = localStorage.getItem("co-efficient-token");

            if (!storedToken) {
                setAuth((prev) => ({
                    ...prev,
                    loading: false,
                }));
                return;
            }

            try {
                const currentUser = await AuthService.getCurrentUser(storedToken);

                setAuth({
                    user: currentUser,
                    token: storedToken,
                    loading: false,
                });

                console.log("[Auth] Session restored.");
            } catch {
                localStorage.removeItem("co-efficient-token");

                setAuth({
                    user: null,
                    token: null,
                    loading: false,
                });

                console.log("[Auth] Session expired.");
            }
        }

        restoreSession();
    }, []);

    const login = useCallback(async (username, password) => {
        const data = await AuthService.login(username, password);

        localStorage.setItem("co-efficient-token", data.token);

        setAuth({
            user: data.user,
            token: data.token,
            loading: false,
        });

        console.log("[Auth] Login successful.");
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem("co-efficient-token");

        setAuth({
            user: null,
            token: null,
            loading: false,
        });

        console.log("[Auth] Logged out.");
    }, []);

    return {
        ...auth,

        login,
        logout,
    };
}

export function useAuth() {
    return useAuthContext();
}
