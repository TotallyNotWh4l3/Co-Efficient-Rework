// ===================================================
// ファイル名: WeatherEditControls.jsx
// 作成日: 2026/10/27
// 概要: 天気ページのヘッダーに置く「編集モード」ボタン群
//       ・編集 / 完了 の切り替え（常に表示。狭い画面では無効）
//       ・編集中だけ: モジュール追加メニュー、レイアウトを初期状態に戻す（2 回クリックで実行）
// ===================================================

import { useEffect, useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, Pencil, Plus, RotateCcw } from "lucide-react";

import { MULTI_TYPES, SINGLE_TYPES } from "./weatherLayout";

/**
 * @param {object} T — lang.weatherPage
 * @param {boolean} editing
 * @param {boolean} canEdit — false in narrow windows (stacked layout)
 * @param {Set<string>} present — module ids currently on the page
 * @param {() => void} onToggle
 * @param {(type:string) => {item?:object, error?:string}} onAdd
 * @param {() => void} onReset
 */
export default function WeatherEditControls({
    T,
    editing,
    canEdit,
    present,
    onToggle,
    onAdd,
    onReset,
}) {
    const E = T.edit;
    const [armed, setArmed] = useState(false);
    const [note, setNote] = useState(null);

    useEffect(() => {
        if (!armed) return undefined;
        const id = setTimeout(() => setArmed(false), 2500);
        return () => clearTimeout(id);
    }, [armed]);

    useEffect(() => {
        if (!note) return undefined;
        const id = setTimeout(() => setNote(null), 3500);
        return () => clearTimeout(id);
    }, [note]);

    const add = (type) => {
        const result = onAdd(type);
        if (result.error === "no_space") setNote(E.noSpace);
    };

    // single-instance modules can only be added back once they were removed
    const missing = SINGLE_TYPES.filter((type) => !present.has(type));

    return (
        <>
            {editing && (
                <>
                    {note && (
                        <span className="wxp-editnote" role="status">
                            {note}
                        </span>
                    )}

                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                            <button className="wxp-icon-btn" title={E.add} aria-label={E.add}>
                                <Plus size={14} />
                                <span className="wxp-btn-text">{E.add}</span>
                            </button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                            <DropdownMenu.Content className="wxp-menu" sideOffset={6} align="end">
                                {MULTI_TYPES.map((type) => (
                                    <DropdownMenu.Item
                                        key={type}
                                        className="wxp-menu__item"
                                        onSelect={() => add(type)}
                                    >
                                        {E.modules[type]}
                                    </DropdownMenu.Item>
                                ))}
                                {missing.length > 0 && (
                                    <DropdownMenu.Separator className="wxp-menu__sep" />
                                )}
                                {missing.map((type) => (
                                    <DropdownMenu.Item
                                        key={type}
                                        className="wxp-menu__item"
                                        onSelect={() => add(type)}
                                    >
                                        {E.modules[type]}
                                    </DropdownMenu.Item>
                                ))}
                            </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                    </DropdownMenu.Root>

                    <button
                        className={`wxp-icon-btn${armed ? " is-armed" : ""}`}
                        title={E.reset}
                        aria-label={E.reset}
                        onClick={() => {
                            if (armed) {
                                setArmed(false);
                                onReset();
                            } else setArmed(true);
                        }}
                        onBlur={() => setArmed(false)}
                    >
                        <RotateCcw size={14} />
                        <span className="wxp-btn-text">{armed ? E.resetConfirm : E.reset}</span>
                    </button>
                </>
            )}

            <button
                className={`wxp-icon-btn wxp-editbtn${editing ? " is-on" : ""}`}
                onClick={onToggle}
                disabled={!canEdit}
                aria-pressed={editing}
                title={canEdit ? (editing ? E.done : E.enter) : E.needWide}
                aria-label={editing ? E.done : E.enter}
            >
                {editing ? <Check size={14} /> : <Pencil size={14} />}
                <span className="wxp-btn-text">{editing ? E.done : E.enter}</span>
            </button>
        </>
    );
}
