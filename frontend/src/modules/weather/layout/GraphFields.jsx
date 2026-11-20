// ===================================================
// ファイル名: GraphFields.jsx
// 作成日: 2026/10/30
// 概要: グラフ線スタイル（太さ・なめらかさ・塗りの濃さ）のスライダー群。
//       ページ全体の設定パネル（GraphSettingsPanel）と、モジュールごとの設定パネル
//       （ModuleSettingsPanel）で共通に使う。
//       モジュール側では、上書きしている項目だけにリセットボタンが出て、
//       上書きしていない項目は「全体」の値に従っていることを示す。
// ===================================================

import { RotateCcw } from "lucide-react";

import { GRAPH_KEYS, GRAPH_LIMITS } from "../utils/graphStyle";

const SHOW = {
    lineWidth: (v) => `${v}px`,
    smoothness: (v) => `${Math.round(v * 100)}%`,
    fillOpacity: (v) => `${Math.round(v * 100)}%`,
};

/**
 * @param {object} T — lang.weatherPage
 * @param {{lineWidth:number, smoothness:number, fillOpacity:number}} value — values shown
 * @param {(key:string, value:number) => void} onChange
 * @param {object} [overridden] — module mode: the keys this module overrides (others follow
 *   the page-wide value). Leave out in the page-wide panel.
 * @param {(key:string) => void} [onReset] — module mode: drop one override
 */
export default function GraphFields({ T, value, onChange, overridden, onReset }) {
    const G = T.graph;
    const moduleMode = Boolean(overridden && onReset);

    return (
        <div className="wxp-mpanel__sliders">
            {GRAPH_KEYS.map((key) => {
                const { min, max, step } = GRAPH_LIMITS[key];
                const own = moduleMode && Object.hasOwn(overridden, key);
                return (
                    <div
                        key={key}
                        className={`wxp-mpanel__slider${moduleMode ? "" : " wxp-mpanel__slider--global"}`}
                    >
                        <span>{G[key]}</span>
                        <input
                            type="range"
                            min={min}
                            max={max}
                            step={step}
                            value={value[key]}
                            aria-label={G[key]}
                            onChange={(e) => onChange(key, Number(e.target.value))}
                        />
                        <b>{SHOW[key](value[key])}</b>
                        {moduleMode &&
                            (own ? (
                                <button
                                    type="button"
                                    className="wxp-icon-btn"
                                    title={G.resetOne}
                                    aria-label={`${G[key]}: ${G.resetOne}`}
                                    onClick={() => onReset(key)}
                                >
                                    <RotateCcw size={12} />
                                </button>
                            ) : (
                                <em className="wxp-mpanel__tag">{G.inherited}</em>
                            ))}
                    </div>
                );
            })}
        </div>
    );
}
