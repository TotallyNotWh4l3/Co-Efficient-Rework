// ===================================================
// ファイル名: ModulePositionPreview.jsx
// 概要: モジュール配置プレビュー — グリッド上でモジュールの位置・サイズ・削除を行う
// ===================================================

import "./module-position-preview.css";

import { useEffect, useRef, useState } from "react";
import { Check, Trash2, X } from "lucide-react";

import { canPlaceAt } from "../../../../../shared/utils/grid";

// Measures the real dashboard workspace (when it's mounted behind the
// settings page) so the preview can share its proportions and report the
// true cell size. Falls back to the window's own aspect ratio otherwise.
function useWorkspaceSize() {
    const [size, setSize] = useState({ w: 16, h: 9, measured: false });

    useEffect(() => {
        const el = document.querySelector(".dashboard__workspace");

        if (!el) {
            const update = () => {
                setSize({ w: window.innerWidth, h: window.innerHeight, measured: false });
            };
            update();
            window.addEventListener("resize", update);
            return () => window.removeEventListener("resize", update);
        }

        const observer = new ResizeObserver(() => {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                setSize({ w: rect.width, h: rect.height, measured: true });
            }
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return size;
}

export default function ModulePositionPreview({
    layout,
    modules,
    labelFor,
    onMove,
    onResize,
    onRemove,
    copy = {},
}) {
    const { columns, rows, gap = 0, padding = 0 } = layout;

    const gridRef = useRef(null);
    const [selectedId, setSelectedId] = useState(null);
    const [drag, setDrag] = useState(null); // { id, dc, dr } — which cell of the module was grabbed
    const [hover, setHover] = useState(null); // { col, row } — cell under the pointer
    const [message, setMessage] = useState(null);
    // { id, w, h, ok, validW, validH } — w/h is what the pointer asks for,
    // validW/validH the last size that fit (what the block actually shows).
    const [resize, setResize] = useState(null);
    const [confirmRemoveId, setConfirmRemoveId] = useState(null); // module awaiting "remove?" confirmation
    const resizingRef = useRef(false); // set synchronously so a native drag can't start mid-resize

    const workspace = useWorkspaceSize();

    const activeId = drag?.id ?? selectedId;
    const active = modules.find((m) => m.id === activeId) ?? null;

    // Where the active module's top-left corner would land right now. While
    // dragging, the grabbed cell stays under the pointer (dc/dr); for
    // click-to-move the hovered cell becomes the top-left corner.
    const computeTarget = (cell) => {
        if (!active || !cell) return null;
        const w = active.layout?.w ?? 1;
        const h = active.layout?.h ?? 1;
        const col = cell.col - (drag?.dc ?? 0);
        const row = cell.row - (drag?.dr ?? 0);
        const others = modules.filter((m) => m.id !== active.id);
        const check = canPlaceAt({ col, row, w, h, columns, rows, others });
        return { col, row, w, h, ...check };
    };

    const target = computeTarget(hover);

    const cellFromEvent = (event) => {
        const rect = gridRef.current.getBoundingClientRect();
        const clamp = (value, max) => Math.min(max - 1, Math.max(0, Math.floor(value)));
        return {
            col: clamp(((event.clientX - rect.left) / rect.width) * columns, columns),
            row: clamp(((event.clientY - rect.top) / rect.height) * rows, rows),
        };
    };

    const setHoverIfChanged = (cell) => {
        setHover((prev) => (prev?.col === cell.col && prev?.row === cell.row ? prev : cell));
    };

    const attemptMove = async (module, dest) => {
        if (!dest) return;
        if (!dest.ok) {
            setMessage(
                dest.reason === "occupied"
                    ? (copy.occupied ?? "That spot is already taken.")
                    : (copy.outOfBounds ?? "The module doesn't fit there."),
            );
            return;
        }

        const cellIndex = dest.row * columns + dest.col;
        if (cellIndex === module.cellIndex) {
            setSelectedId(null);
            return;
        }

        try {
            await onMove(module.id, cellIndex);
            setSelectedId(null);
            setMessage(null);
        } catch {
            setMessage(copy.moveFailed ?? "Couldn't move the module. Try again.");
        }
    };

    // ---------- Remove (trash button -> inline confirm) ----------
    const confirmRemove = async (module) => {
        setConfirmRemoveId(null);
        try {
            await onRemove(module.id);
            setSelectedId((prev) => (prev === module.id ? null : prev));
            setMessage(null);
        } catch {
            setMessage(copy.removeFailed ?? "Couldn't remove the module. Try again.");
        }
    };

    // ---------- Resize (drag a block's edge / corner) ----------
    const startResize = (event, module, axis) => {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        resizingRef.current = true;

        const w = module.layout?.w ?? 1;
        const h = module.layout?.h ?? 1;
        setSelectedId(null);
        setHover(null);
        setMessage(null);
        setResize({ id: module.id, axis, w, h, ok: true, validW: w, validH: h });
    };

    const moveResize = (event, module) => {
        if (!resize || resize.id !== module.id) return;

        const cell = cellFromEvent(event);
        const col = module.cellIndex % columns;
        const row = Math.floor(module.cellIndex / columns);
        const w = resize.axis === "s" ? (module.layout?.w ?? 1) : Math.max(1, cell.col - col + 1);
        const h = resize.axis === "e" ? (module.layout?.h ?? 1) : Math.max(1, cell.row - row + 1);

        if (w === resize.w && h === resize.h) return;

        const others = modules.filter((m) => m.id !== module.id);
        const check = canPlaceAt({ col, row, w, h, columns, rows, others });
        setResize((prev) => ({
            ...prev,
            w,
            h,
            ok: check.ok,
            validW: check.ok ? w : prev.validW,
            validH: check.ok ? h : prev.validH,
        }));
    };

    const endResize = async (module, commit) => {
        if (!resizingRef.current) return; // pointerup and lostpointercapture both land here
        const current = resize;
        resizingRef.current = false;
        setResize(null);
        if (!commit || !current || current.id !== module.id) return;

        const w = module.layout?.w ?? 1;
        const h = module.layout?.h ?? 1;
        if (current.validW === w && current.validH === h) {
            if (!current.ok) setMessage(copy.resizeBlocked ?? "There's no room to grow that way.");
            return;
        }

        try {
            await onResize(module.id, { w: current.validW, h: current.validH });
            setMessage(null);
        } catch {
            setMessage(copy.resizeFailed ?? "Couldn't resize the module. Try again.");
        }
    };

    // ---------- Drag & drop ----------
    const handleDragStart = (event, module) => {
        if (resizingRef.current) {
            event.preventDefault();
            return;
        }
        const cell = cellFromEvent(event);
        const startCol = module.cellIndex % columns;
        const startRow = Math.floor(module.cellIndex / columns);
        const w = module.layout?.w ?? 1;
        const h = module.layout?.h ?? 1;

        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", module.id); // Firefox needs data set to start a drag
        setDrag({
            id: module.id,
            dc: Math.min(w - 1, Math.max(0, cell.col - startCol)),
            dr: Math.min(h - 1, Math.max(0, cell.row - startRow)),
        });
        setSelectedId(null);
        setMessage(null);
    };

    const handleDragOver = (event) => {
        if (!drag) return;
        event.preventDefault();
        const cell = cellFromEvent(event);
        event.dataTransfer.dropEffect = computeTarget(cell)?.ok ? "move" : "none";
        setHoverIfChanged(cell);
    };

    const handleDrop = (event) => {
        if (!drag || !active) return;
        event.preventDefault();
        const dest = computeTarget(cellFromEvent(event));
        setDrag(null);
        setHover(null);
        attemptMove(active, dest);
    };

    const handleDragEnd = () => {
        setDrag(null);
        setHover(null);
    };

    const handleDragLeave = (event) => {
        if (!gridRef.current.contains(event.relatedTarget)) setHover(null);
    };

    // ---------- Click to move (also the touch / keyboard-free fallback) ----------
    const toggleSelected = (module) => {
        setSelectedId((prev) => (prev === module.id ? null : module.id));
        setHover(null);
        setMessage(null);
    };

    const handleGridClick = (event) => {
        if (!selectedId || drag || !active) return;
        attemptMove(active, computeTarget(cellFromEvent(event)));
    };

    const handleGridMouseMove = (event) => {
        if (selectedId && !drag) setHoverIfChanged(cellFromEvent(event));
    };

    // Ghost outline of where the active module would land. Clamped so an
    // out-of-bounds target is still drawn (in red) rather than vanishing.
    const ghost =
        target && (drag || selectedId)
            ? {
                  col: Math.min(Math.max(target.col, 0), Math.max(0, columns - target.w)),
                  row: Math.min(Math.max(target.row, 0), Math.max(0, rows - target.h)),
                  w: Math.min(target.w, columns),
                  h: Math.min(target.h, rows),
                  ok: target.ok,
              }
            : null;

    const resizeGhost =
        resize && !resize.ok
            ? {
                  col: modules.find((m) => m.id === resize.id).cellIndex % columns,
                  row: Math.floor(modules.find((m) => m.id === resize.id).cellIndex / columns),
                  w: Math.min(resize.w, columns),
                  h: Math.min(resize.h, rows),
              }
            : null;

    const cellWidth = Math.round((workspace.w - padding * 2 - gap * (columns - 1)) / columns);
    const cellHeight = Math.round((workspace.h - padding * 2 - gap * (rows - 1)) / rows);

    return (
        <div className="mpp">
            <div
                ref={gridRef}
                className="mpp__grid"
                style={{
                    "--mpp-cols": columns,
                    "--mpp-rows": rows,
                    aspectRatio: `${workspace.w} / ${workspace.h}`,
                }}
                onClick={handleGridClick}
                onMouseMove={handleGridMouseMove}
                onMouseLeave={() => {
                    if (!drag) setHover(null);
                }}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragLeave={handleDragLeave}
                onKeyDown={(event) => {
                    if (event.key === "Escape") setSelectedId(null);
                }}
            >
                {Array.from({ length: columns * rows }, (_, index) => (
                    <div
                        key={index}
                        className="mpp__cell"
                        style={{
                            gridColumn: (index % columns) + 1,
                            gridRow: Math.floor(index / columns) + 1,
                        }}
                    />
                ))}

                {modules.map((module) => {
                    const isResizing = resize?.id === module.id;
                    const w = isResizing ? resize.validW : (module.layout?.w ?? 1);
                    const h = isResizing ? resize.validH : (module.layout?.h ?? 1);
                    const col = module.cellIndex % columns;
                    const row = Math.floor(module.cellIndex / columns);
                    const isSelected = selectedId === module.id;
                    const isDragging = drag?.id === module.id;

                    return (
                        <div
                            key={module.id}
                            className={[
                                "mpp__module",
                                `mpp__module--${module.type}`,
                                isSelected ? "mpp__module--selected" : "",
                                isDragging ? "mpp__module--dragging" : "",
                                isResizing ? "mpp__module--resizing" : "",
                            ].join(" ")}
                            style={{
                                gridColumn: `${col + 1} / span ${w}`,
                                gridRow: `${row + 1} / span ${h}`,
                            }}
                            draggable={!resize}
                            role="button"
                            tabIndex={0}
                            aria-pressed={isSelected}
                            onDragStart={(event) => handleDragStart(event, module)}
                            onDragEnd={handleDragEnd}
                            onClick={(event) => {
                                event.stopPropagation();
                                toggleSelected(module);
                            }}
                            onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    toggleSelected(module);
                                }
                            }}
                        >
                            <div className="mpp__module-body">
                                <span className="mpp__module-title">{labelFor(module)}</span>
                                <span className="mpp__module-size">
                                    {w}×{h}
                                </span>
                            </div>

                            {confirmRemoveId === module.id ? (
                                <div
                                    className="mpp__confirm"
                                    role="alertdialog"
                                    onClick={(event) => event.stopPropagation()}
                                >
                                    <span className="mpp__confirm-text">
                                        {copy.removeConfirm ?? "Remove?"}
                                    </span>
                                    <div className="mpp__confirm-actions">
                                        <button
                                            type="button"
                                            className="mpp__icon-btn mpp__icon-btn--danger"
                                            title={copy.removeYes ?? "Remove"}
                                            onClick={() => confirmRemove(module)}
                                        >
                                            <Check size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            className="mpp__icon-btn"
                                            title={copy.removeNo ?? "Cancel"}
                                            onClick={() => setConfirmRemoveId(null)}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    className="mpp__remove"
                                    title={copy.remove ?? "Remove"}
                                    aria-label={copy.remove ?? "Remove"}
                                    draggable={false}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        setConfirmRemoveId(module.id);
                                        setSelectedId(null);
                                    }}
                                >
                                    <Trash2 size={13} />
                                </button>
                            )}

                            <span
                                className="mpp__grip"
                                role="presentation"
                                title={copy.resizeBoth ?? "Drag to resize"}
                                draggable={false}
                                onPointerDown={(event) => startResize(event, module, "se")}
                                onPointerMove={(event) => moveResize(event, module)}
                                onPointerUp={() => endResize(module, true)}
                                onPointerCancel={() => endResize(module, false)}
                                onLostPointerCapture={() => endResize(module, false)}
                                onDragStart={(event) => event.preventDefault()}
                                onClick={(event) => event.stopPropagation()}
                            >
                                <span className="mpp__grip-dots" />
                            </span>
                        </div>
                    );
                })}

                {resizeGhost && (
                    <div
                        className="mpp__ghost mpp__ghost--bad"
                        style={{
                            gridColumn: `${resizeGhost.col + 1} / span ${resizeGhost.w}`,
                            gridRow: `${resizeGhost.row + 1} / span ${resizeGhost.h}`,
                        }}
                    />
                )}

                {ghost && (
                    <div
                        className={`mpp__ghost mpp__ghost--${ghost.ok ? "ok" : "bad"}`}
                        style={{
                            gridColumn: `${ghost.col + 1} / span ${ghost.w}`,
                            gridRow: `${ghost.row + 1} / span ${ghost.h}`,
                        }}
                    />
                )}
            </div>

            <div className="mpp__footer">
                <span className="mpp__caption">
                    {copy.gridLabel ?? "Grid"} {columns}×{rows}
                    {workspace.measured && cellWidth > 0 && cellHeight > 0 && (
                        <>
                            {" · "}
                            {copy.cellApprox ?? "Each cell ≈"} {cellWidth} × {cellHeight} px
                        </>
                    )}
                </span>
                <span
                    className={`mpp__status${message ? " mpp__status--error" : ""}`}
                    role="status"
                >
                    {message ??
                        (selectedId
                            ? (copy.selectedHint ?? "Click a cell to place the module there.")
                            : (copy.hint ?? "Drag a module to move it, drag its edge to resize."))}
                </span>
            </div>
        </div>
    );
}
