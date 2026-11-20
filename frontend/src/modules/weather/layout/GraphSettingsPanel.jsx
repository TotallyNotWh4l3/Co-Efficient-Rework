// ===================================================
// ファイル名: GraphSettingsPanel.jsx
// 作成日: 2026/10/30
// 概要: 天気ページ全体のグラフ設定パネル（ヘッダーのボタンの下に開くポップオーバー）
//       線の太さ・なめらかさ・塗りの濃さを、ページ上のすべてのグラフにまとめて適用する。
//       モジュールごとの上書きは、編集モードのモジュール設定パネルで行う。
//       変更はその場でページに反映される（保存ボタンなし）。
// ===================================================

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { RotateCcw, X } from "lucide-react";

import { GRAPH_DEFAULTS, GRAPH_KEYS } from "../utils/graphStyle";
import GraphFields from "./GraphFields";

const MARGIN = 8;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// The header button that opens this panel carries this attribute, so pressing it
// again closes the panel instead of closing and immediately re-opening it.
export const GRAPH_TRIGGER_ATTR = "data-wxp-graph-trigger";

/**
 * @param {DOMRect} anchor — the header button, the panel opens right below it
 * @param {object} T — lang.weatherPage
 * @param {{lineWidth:number, smoothness:number, fillOpacity:number}} value
 * @param {(next:object|null) => void} onChange — null = back to the defaults
 * @param {() => void} onClose
 */
export default function GraphSettingsPanel({ anchor, T, value, onChange, onClose }) {
    const ref = useRef(null);
    const [pos, setPos] = useState(null);

    // Right edge aligned with the button, below it; always fully inside the window.
    useLayoutEffect(() => {
        const { width, height } = ref.current.getBoundingClientRect();
        const left = clamp(
            anchor.right - width,
            MARGIN,
            Math.max(MARGIN, window.innerWidth - width - MARGIN),
        );
        const top = clamp(
            anchor.bottom + MARGIN,
            MARGIN,
            Math.max(MARGIN, window.innerHeight - height - MARGIN),
        );
        setPos((prev) => (prev?.left === left && prev?.top === top ? prev : { left, top }));
    }, [anchor]);

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        const onDown = (e) => {
            if (ref.current?.contains(e.target)) return;
            if (e.target.closest?.(`[${GRAPH_TRIGGER_ATTR}]`)) return;
            onClose();
        };
        window.addEventListener("keydown", onKey);
        document.addEventListener("pointerdown", onDown, true);
        return () => {
            window.removeEventListener("keydown", onKey);
            document.removeEventListener("pointerdown", onDown, true);
        };
    }, [onClose]);

    const G = T.graph;
    const isDefault = GRAPH_KEYS.every((k) => value[k] === GRAPH_DEFAULTS[k]);

    return (
        <div
            ref={ref}
            className="wxp-mpanel"
            role="dialog"
            aria-label={G.title}
            style={pos ? { left: pos.left, top: pos.top } : { visibility: "hidden" }}
        >
            <header className="wxp-mpanel__head">
                <h4>{G.title}</h4>
                <button
                    type="button"
                    className="wxp-icon-btn"
                    onClick={onClose}
                    aria-label={T.edit.settings.close}
                    title={T.edit.settings.close}
                >
                    <X size={14} />
                </button>
            </header>

            <p className="wxp-mpanel__hint">{G.pageHint}</p>

            <GraphFields
                T={T}
                value={value}
                onChange={(key, v) => onChange({ ...value, [key]: v })}
            />

            <button
                type="button"
                className="wxp-retry wxp-mpanel__add"
                disabled={isDefault}
                onClick={() => onChange(null)}
            >
                <RotateCcw size={12} />
                {G.resetAll}
            </button>
        </div>
    );
}
