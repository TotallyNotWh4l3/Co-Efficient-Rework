// ===================================================
// ファイル名: ModulePositionPreview.jsx
// 概要: モジュール配置プレビュー — グリッド上でモジュールの位置を確認・移動する
// ===================================================

import "./module-position-preview.css";

import { useEffect, useRef, useState } from "react";

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

export default function ModulePositionPreview({ layout, modules, labelFor, onMove, copy = {} }) {
    const { columns, rows, gap = 0, padding = 0 } = layout;

    const gridRef = useRef(null);
    const [selectedId, setSelectedId] = useState(null);
    const [drag, setDrag] = useState(null); // { id, dc, dr } — which cell of the module was grabbed
    const [hover, setHover] = useState(null); // { col, row } — cell under the pointer
    const [message, setMessage] = useState(null);

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

    // ---------- Drag & drop ----------
    const handleDragStart = (event, module) => {
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
                    const w = module.layout?.w ?? 1;
                    const h = module.layout?.h ?? 1;
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
                            ].join(" ")}
                            style={{
                                gridColumn: `${col + 1} / span ${w}`,
                                gridRow: `${row + 1} / span ${h}`,
                            }}
                            draggable
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
                        </div>
                    );
                })}

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
                            : (copy.hint ?? "Drag a module, or click it and then a cell."))}
                </span>
            </div>
        </div>
    );
}
