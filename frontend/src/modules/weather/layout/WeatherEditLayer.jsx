// ===================================================
// ファイル名: WeatherEditLayer.jsx
// 作成日: 2026/10/27
// 概要: 編集モードの重ね合わせレイヤー。実際のページの上にグリッド線と各モジュールの枠を出し、
//       そのまま移動（ドラッグ）・リサイズ（端/角のつまみ）・設定（クリック）・削除ができる。
//       ・ポインターイベントで操作するので、ドラッグ中は枠が指に追従し、スナップ先を影で示す
//       ・空いていない場所にドロップ: ちょうど 1 つのモジュールに重なり、入れ替えても収まるなら入れ替え
//       ・キーボード: 矢印で 1 セル移動、Shift+矢印でリサイズ、Enter で設定
//       ・保存はジェスチャーの最後に 1 回だけ（onMove / onResize）
// ===================================================

import { useEffect, useRef, useState } from "react";
import { Settings2, Trash2 } from "lucide-react";

import { resolveMove, resolveResize } from "./weatherLayout";

const DRAG_THRESHOLD_PX = 5;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Two-step remove: first click arms the button, second one removes.
function RemoveButton({ label, armedLabel, onConfirm }) {
    const [armed, setArmed] = useState(false);

    useEffect(() => {
        if (!armed) return undefined;
        const id = setTimeout(() => setArmed(false), 2500);
        return () => clearTimeout(id);
    }, [armed]);

    return (
        <button
            type="button"
            data-nodrag
            className={`wxp-frame__btn wxp-frame__btn--danger${armed ? " is-armed" : ""}`}
            title={armed ? armedLabel : label}
            aria-label={armed ? armedLabel : label}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
                e.stopPropagation();
                if (armed) onConfirm();
                else setArmed(true);
            }}
            onBlur={() => setArmed(false)}
        >
            <Trash2 size={12} />
            {armed && <span>{armedLabel}</span>}
        </button>
    );
}

/**
 * @param {object} layout
 * @param {(item) => string} labelFor — module display name
 * @param {string|null} activeId — module whose settings panel is open
 * @param {(moves) => void} onMove — [{ id, col, row }]
 * @param {(id, w, h) => void} onResize
 * @param {(id) => void} onRemove
 * @param {(id, el) => void} onOpen — open the settings panel next to `el`
 * @param {object} copy — T.edit
 */
export default function WeatherEditLayer({
    layout,
    labelFor,
    activeId,
    onMove,
    onResize,
    onRemove,
    onOpen,
    copy,
}) {
    const { columns, rows, items } = layout;
    const rootRef = useRef(null);
    const gesture = useRef(null);
    const [drag, setDrag] = useState(null); // { id, dx, dy, target }
    const [resize, setResize] = useState(null); // { id, valid:{w,h}, want:{w,h}, ok }

    const cellAt = (e) => {
        const rect = rootRef.current.getBoundingClientRect();
        return {
            col: clamp(
                Math.floor(((e.clientX - rect.left) / rect.width) * columns),
                0,
                columns - 1,
            ),
            row: clamp(Math.floor(((e.clientY - rect.top) / rect.height) * rows), 0, rows - 1),
        };
    };

    const targetFor = (e, g, item) => {
        const cell = cellAt(e);
        return resolveMove(items, item.id, cell.col - g.dc, cell.row - g.dr);
    };

    // ---------- move (drag the frame) ----------
    const onFrameDown = (e, item) => {
        if (e.button !== 0 || e.target.closest("[data-nodrag]")) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        const cell = cellAt(e);
        gesture.current = {
            type: "move",
            id: item.id,
            x0: e.clientX,
            y0: e.clientY,
            // which cell of the module was grabbed, so it stays under the pointer
            dc: clamp(cell.col - item.col, 0, item.w - 1),
            dr: clamp(cell.row - item.row, 0, item.h - 1),
            active: false,
        };
    };

    const onFrameMove = (e, item) => {
        const g = gesture.current;
        if (!g || g.type !== "move" || g.id !== item.id) return;
        const dx = e.clientX - g.x0;
        const dy = e.clientY - g.y0;
        if (!g.active) {
            if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
            g.active = true;
        }
        setDrag({ id: item.id, dx, dy, target: targetFor(e, g, item) });
    };

    const onFrameUp = (e, item) => {
        const g = gesture.current;
        gesture.current = null;
        setDrag(null);
        if (!g || g.type !== "move" || g.id !== item.id) return;

        // no real drag: it was a click -> settings
        if (!g.active) {
            onOpen(item.id, e.currentTarget);
            return;
        }
        const target = targetFor(e, g, item);
        const moved = target.moves.some((m) => {
            const cur = items.find((i) => i.id === m.id);
            return cur.col !== m.col || cur.row !== m.row;
        });
        if (target.ok && moved) onMove(target.moves);
    };

    const cancelGesture = () => {
        gesture.current = null;
        setDrag(null);
        setResize(null);
    };

    // ---------- resize (drag an edge / the corner) ----------
    const onGripDown = (e, item, axis) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        gesture.current = { type: "resize", id: item.id, axis };
        const size = { w: item.w, h: item.h };
        setResize({ id: item.id, valid: size, want: size, ok: true });
    };

    const onGripMove = (e, item) => {
        const g = gesture.current;
        if (!g || g.type !== "resize" || g.id !== item.id) return;
        const cell = cellAt(e);
        const w = g.axis === "s" ? item.w : Math.max(1, cell.col - item.col + 1);
        const h = g.axis === "e" ? item.h : Math.max(1, cell.row - item.row + 1);
        const res = resolveResize(items, item.id, w, h);
        const size = { w: res.rect.w, h: res.rect.h };
        setResize((prev) => ({
            id: item.id,
            want: size,
            ok: res.ok,
            valid: res.ok ? size : (prev?.valid ?? { w: item.w, h: item.h }),
        }));
    };

    const onGripUp = (e, item) => {
        const g = gesture.current;
        const current = resize;
        gesture.current = null;
        setResize(null);
        if (!g || g.type !== "resize" || !current || current.id !== item.id) return;
        const { w, h } = current.valid;
        if (w !== item.w || h !== item.h) onResize(item.id, w, h);
    };

    // ---------- keyboard ----------
    const onFrameKey = (e, item) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen(item.id, e.currentTarget);
            return;
        }
        const step = {
            ArrowLeft: [-1, 0],
            ArrowRight: [1, 0],
            ArrowUp: [0, -1],
            ArrowDown: [0, 1],
        }[e.key];
        if (!step) return;
        e.preventDefault();

        if (e.shiftKey) {
            const res = resolveResize(items, item.id, item.w + step[0], item.h + step[1]);
            if (res.ok && (res.rect.w !== item.w || res.rect.h !== item.h)) {
                onResize(item.id, res.rect.w, res.rect.h);
            }
        } else {
            const res = resolveMove(items, item.id, item.col + step[0], item.row + step[1]);
            if (res.ok) onMove(res.moves);
        }
    };

    // ---------- ghost: where the dragged / resized module would land ----------
    let ghost = null;
    if (drag?.target) {
        const { rect, ok, swap } = drag.target;
        ghost = {
            col: clamp(rect.col, 0, columns - rect.w),
            row: clamp(rect.row, 0, rows - rect.h),
            w: rect.w,
            h: rect.h,
            tone: ok ? (swap ? "swap" : "ok") : "bad",
        };
    } else if (resize && !resize.ok) {
        const it = items.find((i) => i.id === resize.id);
        ghost = {
            col: it.col,
            row: it.row,
            w: Math.min(resize.want.w, columns - it.col),
            h: Math.min(resize.want.h, rows - it.row),
            tone: "bad",
        };
    }

    return (
        <div ref={rootRef} className="wxp-edit" style={{ "--wx-cols": columns, "--wx-rows": rows }}>
            <div className="wxp-edit__grid" aria-hidden="true">
                {Array.from({ length: columns * rows }, (_, i) => (
                    <i key={i} />
                ))}
            </div>

            {items.map((item) => {
                const isDrag = drag?.id === item.id;
                const rs = resize?.id === item.id ? resize : null;
                const w = rs ? rs.valid.w : item.w;
                const h = rs ? rs.valid.h : item.h;
                const name = labelFor(item);

                return (
                    <div
                        key={item.id}
                        className={[
                            "wxp-frame",
                            isDrag ? "is-dragging" : "",
                            rs ? "is-resizing" : "",
                            activeId === item.id ? "is-active" : "",
                        ].join(" ")}
                        style={{
                            gridColumn: `${item.col + 1} / span ${w}`,
                            gridRow: `${item.row + 1} / span ${h}`,
                            transform: isDrag ? `translate(${drag.dx}px, ${drag.dy}px)` : undefined,
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label={`${name} ${w}×${h}`}
                        onPointerDown={(e) => onFrameDown(e, item)}
                        onPointerMove={(e) => onFrameMove(e, item)}
                        onPointerUp={(e) => onFrameUp(e, item)}
                        onPointerCancel={cancelGesture}
                        onKeyDown={(e) => onFrameKey(e, item)}
                    >
                        <span className="wxp-frame__label">
                            {name}
                            <em>
                                {w}×{h}
                            </em>
                        </span>

                        <span className="wxp-frame__tools">
                            <button
                                type="button"
                                data-nodrag
                                className="wxp-frame__btn"
                                title={copy.settings.configure}
                                aria-label={copy.settings.configure}
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpen(item.id, e.currentTarget.closest(".wxp-frame"));
                                }}
                            >
                                <Settings2 size={12} />
                            </button>
                            <RemoveButton
                                label={copy.settings.remove}
                                armedLabel={copy.settings.removeConfirm}
                                onConfirm={() => onRemove(item.id)}
                            />
                        </span>

                        {["e", "s", "se"].map((axis) => (
                            <span
                                key={axis}
                                data-nodrag
                                className={`wxp-frame__grip wxp-frame__grip--${axis}`}
                                role="presentation"
                                onPointerDown={(e) => onGripDown(e, item, axis)}
                                onPointerMove={(e) => onGripMove(e, item)}
                                onPointerUp={(e) => onGripUp(e, item)}
                                onPointerCancel={cancelGesture}
                            />
                        ))}
                    </div>
                );
            })}

            {ghost && (
                <div
                    className={`wxp-ghost wxp-ghost--${ghost.tone}`}
                    style={{
                        gridColumn: `${ghost.col + 1} / span ${ghost.w}`,
                        gridRow: `${ghost.row + 1} / span ${ghost.h}`,
                    }}
                />
            )}
        </div>
    );
}
