// ===================================================
// ファイル名: useMediaQuery.js
// 作成日: 2026/10/27
// 概要: CSS メディアクエリの一致状態を返すフック（狭い画面では編集モードを使えなくする判定用）
// ===================================================

import { useCallback, useSyncExternalStore } from "react";

export default function useMediaQuery(query) {
    const subscribe = useCallback(
        (notify) => {
            const mq = window.matchMedia(query);
            mq.addEventListener("change", notify);
            return () => mq.removeEventListener("change", notify);
        },
        [query],
    );
    return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches);
}
