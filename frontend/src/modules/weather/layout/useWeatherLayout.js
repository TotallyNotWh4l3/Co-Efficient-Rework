// ===================================================
// ファイル名: useWeatherLayout.js
// 作成日: 2026/10/27
// 概要: 天気ページのレイアウトを取得・編集するフック
//       preferences.weatherLayout（ユーザー設定。useSettings が自動保存）に保存する。
//       値の検証は sanitizeLayout が行うので、保存済みデータが壊れていても描画は壊れない。
//       編集操作は 1 回のジェスチャーにつき 1 回だけ保存する（ドラッグ中は保存しない）。
// ===================================================

import { useCallback, useEffect, useMemo, useRef } from "react";

import { LAYOUT_VERSION, createItem, sanitizeLayout } from "./weatherLayout";

/**
 * @param {object|null|undefined} stored — settings.preferences.weatherLayout
 * @param {(layout: object|null) => void} save — writes it back (null = back to default)
 */
export default function useWeatherLayout(stored, save) {
    const layout = useMemo(() => sanitizeLayout(stored), [stored]);

    // Edits read the latest layout from a ref, so two edits fired before the
    // next render still build on each other instead of overwriting.
    const latest = useRef(layout);
    useEffect(() => {
        latest.current = layout;
    }, [layout]);

    const commit = useCallback(
        (items) => {
            const next = { ...latest.current, version: LAYOUT_VERSION, items };
            latest.current = next;
            save(next);
        },
        [save],
    );

    const patch = useCallback(
        (id, change) =>
            commit(latest.current.items.map((i) => (i.id === id ? { ...i, ...change } : i))),
        [commit],
    );

    /** moves: [{ id, col, row }] — a swap moves two modules in one save. */
    const move = useCallback(
        (moves) =>
            commit(
                latest.current.items.map((i) => {
                    const m = moves.find((x) => x.id === i.id);
                    return m ? { ...i, col: m.col, row: m.row } : i;
                }),
            ),
        [commit],
    );

    const resize = useCallback((id, w, h) => patch(id, { w, h }), [patch]);
    const configure = useCallback((id, config) => patch(id, { config }), [patch]);

    const remove = useCallback(
        (id) => commit(latest.current.items.filter((i) => i.id !== id)),
        [commit],
    );

    /** @returns {{item}|{error:"exists"|"no_space"}} */
    const add = useCallback(
        (type) => {
            const result = createItem(latest.current.items, type);
            if (result.item) commit([...latest.current.items, result.item]);
            return result;
        },
        [commit],
    );

    const reset = useCallback(() => {
        latest.current = sanitizeLayout(null);
        save(null);
    }, [save]);

    return { layout, move, resize, configure, remove, add, reset };
}
