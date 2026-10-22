// ===================================================
// ファイル名: usePersistentState.js
// 作成日: 2026/10/22
// 概要: localStorage に保存される useState（天気ページの表示設定用）
// ===================================================

import { useEffect, useState } from "react";

export default function usePersistentState(key, initial) {
    const [value, setValue] = useState(() => {
        const raw = localStorage.getItem(key);
        return raw === null ? initial : JSON.parse(raw);
    });

    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);

    return [value, setValue];
}