// ===================================================
// ファイル名: ModuleSettingsPanel.jsx
// 作成日: 2026/10/27
// 概要: 編集モードで、モジュールの横に開く設定パネル（ポップオーバー）
//       ・tile : 表示する指標 / 下部の表示（グラフ or ゲージ）
//       ・card : タイトル / 表示する指標（複数）と指標ごとの表示形式（折れ線・面・棒・ゲージ）
//       ・それ以外のモジュール: まだ設定項目なし（プレースホルダー表示）
//       変更はその場でページに反映される（保存ボタンなし）。ページを見ながら調整できるよう、
//       ページ全体を覆わず、モジュールの隣に置く。
//       2026/10/30: ・tile : サブ表示の指標（既定 / なし / 別の指標）とグラフの色（リセット可）
//                   ・tile / card : グラフ線スタイル（太さ・なめらかさ・塗り）を、ページ全体の
//                     設定とは別に上書きできる（上書きした項目だけ個別にリセット可）
// ===================================================

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Plus, RotateCcw, X } from "lucide-react";

import {
    CARD_STYLES,
    MAX_CARD_METRICS,
    METRIC_DEFS,
    METRIC_IDS,
    TILE_DISPLAYS,
    TILE_SUB_DEFAULT,
    TILE_SUB_NONE,
    cardAxesFit,
} from "../metrics/metricDefs";
import { isHexColor, resolveGraph } from "../utils/graphStyle";
import GraphFields from "./GraphFields";

const MARGIN = 8;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// <input type="color"> needs a "#rrggbb" value; a metric whose default colour is a
// theme variable (not a hex) starts the picker on this neutral grey instead.
const PICKER_FALLBACK = "#94a3b8";

const without = (obj, key) => Object.fromEntries(Object.entries(obj).filter(([k]) => k !== key));

/**
 * The line-style overrides of one module. Values it does not override follow the
 * page-wide settings; each overridden one can be reset on its own, or all at once.
 */
function GraphSection({ config, graphGlobal, T, onChange }) {
    const G = T.graph;
    const overrides = config.graph ?? {};
    const hasOverrides = Object.keys(overrides).length > 0;

    const set = (key, value) => onChange({ ...config, graph: { ...overrides, [key]: value } });
    const reset = (key) => {
        const next = without(overrides, key);
        const stillOverriding = Object.keys(next).length > 0;
        onChange(stillOverriding ? { ...config, graph: next } : without(config, "graph"));
    };

    return (
        <div className="wxp-mpanel__sect">
            <h5>{G.title}</h5>
            <p className="wxp-mpanel__hint">{G.moduleHint}</p>
            <GraphFields
                T={T}
                value={resolveGraph(graphGlobal, overrides)}
                overridden={overrides}
                onChange={set}
                onReset={reset}
            />
            <button
                type="button"
                className="wxp-retry wxp-mpanel__add"
                disabled={!hasOverrides}
                onClick={() => onChange(without(config, "graph"))}
            >
                <RotateCcw size={12} />
                {G.useGlobal}
            </button>
        </div>
    );
}

function Segmented({ value, options, label, onChange, isDisabled = () => false }) {
    return (
        <div className="wxp-segmented" role="group" aria-label={label}>
            {options.map(({ id, text }) => (
                <button
                    key={id}
                    type="button"
                    className={value === id ? "is-active" : ""}
                    disabled={isDisabled(id)}
                    onClick={() => onChange(id)}
                >
                    {text}
                </button>
            ))}
        </div>
    );
}

function TileForm({ config, T, graphGlobal, onChange }) {
    const S = T.edit.settings;
    const def = METRIC_DEFS[config.metric];
    const defaultColor = [def.accent, def.color].find(isHexColor) ?? PICKER_FALLBACK;
    return (
        <>
            <label className="wxp-mpanel__field">
                <span>{S.metric}</span>
                <span className="wxp-select">
                    <select
                        value={config.metric}
                        onChange={(e) => onChange({ ...config, metric: e.target.value })}
                    >
                        {METRIC_IDS.map((id) => (
                            <option key={id} value={id}>
                                {T.metrics[id]}
                            </option>
                        ))}
                    </select>
                </span>
            </label>

            <div className="wxp-mpanel__field">
                <span>{S.display}</span>
                <Segmented
                    label={S.display}
                    value={config.display}
                    options={TILE_DISPLAYS.map((id) => ({ id, text: S.displays[id] }))}
                    onChange={(display) => onChange({ ...config, display })}
                />
            </div>

            <label className="wxp-mpanel__field">
                <span>{S.sub}</span>
                <span className="wxp-select">
                    <select
                        value={config.sub ?? TILE_SUB_DEFAULT}
                        onChange={(e) => onChange({ ...config, sub: e.target.value })}
                    >
                        <option value={TILE_SUB_DEFAULT}>{S.subDefault}</option>
                        <option value={TILE_SUB_NONE}>{S.subNone}</option>
                        {METRIC_IDS.map((id) => (
                            <option key={id} value={id}>
                                {T.metrics[id]}
                            </option>
                        ))}
                    </select>
                </span>
            </label>

            <div className="wxp-mpanel__field">
                <span>{S.color}</span>
                <span className="wxp-mpanel__colorwrap">
                    <input
                        type="color"
                        className="wxp-mpanel__color"
                        value={config.color ?? defaultColor}
                        aria-label={S.color}
                        onChange={(e) => onChange({ ...config, color: e.target.value })}
                    />
                    <button
                        type="button"
                        className="wxp-icon-btn"
                        title={S.colorReset}
                        aria-label={S.colorReset}
                        disabled={!config.color}
                        onClick={() => onChange(without(config, "color"))}
                    >
                        <RotateCcw size={12} />
                    </button>
                </span>
            </div>

            <GraphSection config={config} graphGlobal={graphGlobal} T={T} onChange={onChange} />
        </>
    );
}

function CardForm({ config, T, graphGlobal, onChange }) {
    const S = T.edit.settings;
    const rows = config.metrics;
    const [title, setTitle] = useState(config.title ?? "");

    const setRows = (metrics) => onChange({ ...config, metrics });
    const setRow = (index, change) =>
        setRows(rows.map((r, i) => (i === index ? { ...r, ...change } : r)));

    const used = new Set(rows.map((r) => r.id));
    // A metric may be picked when it is not on the card yet and the card still
    // fits on two Y axes (a gauge row needs no axis, so it always fits).
    const canPick = (index, id) =>
        (id === rows[index].id || !used.has(id)) &&
        cardAxesFit(rows.map((r, i) => (i === index ? { ...r, id } : r)));
    const canStyle = (index, style) =>
        cardAxesFit(rows.map((r, i) => (i === index ? { ...r, style } : r)));

    const addMetric = () => {
        const free = METRIC_IDS.filter((id) => !used.has(id));
        const fits = free.find((id) =>
            cardAxesFit([...rows, { id, style: METRIC_DEFS[id].style }]),
        );
        // none fits as a chart line -> add one as a gauge, which needs no axis
        const id = fits ?? free[0];
        if (id) setRows([...rows, { id, style: fits ? METRIC_DEFS[id].style : "gauge" }]);
    };

    return (
        <>
            <label className="wxp-mpanel__field">
                <span>{S.cardTitle}</span>
                <input
                    className="wxp-mpanel__input"
                    type="text"
                    maxLength={40}
                    value={title}
                    placeholder={S.cardTitleAuto}
                    onChange={(e) => {
                        setTitle(e.target.value);
                        onChange({ ...config, title: e.target.value });
                    }}
                />
            </label>

            <div className="wxp-mpanel__field wxp-mpanel__field--col">
                <span>{S.metrics}</span>
                {rows.map((row, index) => (
                    <div key={row.id} className="wxp-mpanel__row">
                        <span className="wxp-select">
                            <select
                                value={row.id}
                                aria-label={S.metric}
                                onChange={(e) => setRow(index, { id: e.target.value })}
                            >
                                {METRIC_IDS.map((id) => (
                                    <option key={id} value={id} disabled={!canPick(index, id)}>
                                        {T.metrics[id]}
                                    </option>
                                ))}
                            </select>
                        </span>
                        <button
                            type="button"
                            className="wxp-icon-btn"
                            title={S.removeMetric}
                            aria-label={S.removeMetric}
                            disabled={rows.length <= 1}
                            onClick={() => setRows(rows.filter((_, i) => i !== index))}
                        >
                            <X size={12} />
                        </button>
                        <Segmented
                            label={S.display}
                            value={row.style}
                            options={CARD_STYLES.map((id) => ({ id, text: S.styles[id] }))}
                            isDisabled={(style) => !canStyle(index, style)}
                            onChange={(style) => setRow(index, { style })}
                        />
                    </div>
                ))}

                <button
                    type="button"
                    className="wxp-retry wxp-mpanel__add"
                    disabled={rows.length >= MAX_CARD_METRICS || used.size >= METRIC_IDS.length}
                    onClick={addMetric}
                >
                    <Plus size={12} />
                    {S.addMetric}
                </button>
                <p className="wxp-mpanel__hint">{S.axisHint}</p>
            </div>

            <GraphSection config={config} graphGlobal={graphGlobal} T={T} onChange={onChange} />
        </>
    );
}

/**
 * @param {object} item — the module being configured
 * @param {DOMRect} anchor — its frame, where the panel is placed next to
 * @param {object} T — lang.weatherPage
 * @param {object} graphGlobal — the page-wide graph style (what a module follows until it overrides)
 * @param {(config:object) => void} onChange
 * @param {() => void} onClose
 */
export default function ModuleSettingsPanel({ item, anchor, T, graphGlobal, onChange, onClose }) {
    const ref = useRef(null);
    const [pos, setPos] = useState(null);

    // Right of the module when there is room, else left, else overlapping it;
    // always fully inside the window. Re-measured when the form grows.
    useLayoutEffect(() => {
        const { width, height } = ref.current.getBoundingClientRect();
        let left = anchor.right + MARGIN;
        if (left + width > window.innerWidth - MARGIN) left = anchor.left - width - MARGIN;
        left = clamp(left, MARGIN, Math.max(MARGIN, window.innerWidth - width - MARGIN));
        const top = clamp(
            anchor.top,
            MARGIN,
            Math.max(MARGIN, window.innerHeight - height - MARGIN),
        );
        setPos((prev) => (prev?.left === left && prev?.top === top ? prev : { left, top }));
        // the panel only changes size when the module's config does (rows added / removed)
    }, [anchor, item.config]);

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        const onDown = (e) => {
            if (!ref.current?.contains(e.target)) onClose();
        };
        window.addEventListener("keydown", onKey);
        document.addEventListener("pointerdown", onDown, true);
        return () => {
            window.removeEventListener("keydown", onKey);
            document.removeEventListener("pointerdown", onDown, true);
        };
    }, [onClose]);

    const S = T.edit.settings;
    return (
        <div
            ref={ref}
            className="wxp-mpanel"
            role="dialog"
            aria-label={`${T.edit.modules[item.type]} · ${S.title}`}
            style={pos ? { left: pos.left, top: pos.top } : { visibility: "hidden" }}
        >
            <header className="wxp-mpanel__head">
                <h4>
                    {T.edit.modules[item.type]}
                    <em>
                        {item.w}×{item.h}
                    </em>
                </h4>
                <button
                    type="button"
                    className="wxp-icon-btn"
                    onClick={onClose}
                    aria-label={S.close}
                    title={S.close}
                >
                    <X size={14} />
                </button>
            </header>

            {item.type === "tile" && (
                <TileForm
                    config={item.config}
                    T={T}
                    graphGlobal={graphGlobal}
                    onChange={onChange}
                />
            )}
            {item.type === "card" && (
                // keyed by module so switching modules resets the title field
                <CardForm
                    key={item.id}
                    config={item.config}
                    T={T}
                    graphGlobal={graphGlobal}
                    onChange={onChange}
                />
            )}
            {item.type !== "tile" && item.type !== "card" && (
                <p className="wxp-mpanel__soon">{S.soon}</p>
            )}
        </div>
    );
}
