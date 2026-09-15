// ===================================================
// ファイル名: apiClient.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: APIクライアント
// ===================================================

import axios from "axios";

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001/api",

    headers: {
        "Content-Type": "application/json",
    },

    timeout: 10000,
});

apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("co-efficient-token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },

    (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
    (response) => response,

    (error) => {
        if (error.response?.status === 401) {
            console.warn("[API] Unauthorized.");

            localStorage.removeItem("co-efficient-token");

            // Prevent redirect loop if already on login page
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }

        return Promise.reject(error);
    },
);

export default apiClient;
