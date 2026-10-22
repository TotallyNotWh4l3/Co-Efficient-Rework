// ===================================================
// ファイル名: AlertPanel.jsx
// 作成日: 2026/10/22
// 概要: アラートしきい値の編集パネル（ルールの有効/無効・指標・条件・値・追加/削除）
//       値は表示単位で入力し、保存時に SI 系へ戻す。
// ===================================================

import { X, Plus, Trash2 } from "lucide-react";

import { ALERT_METRICS } from "../utils/alerts";

export default function AlertPanel({ rules, setRules, units, T, onClose }) {
    const unitOf = (metric) => {
        const m = ALERT_METRICS[metric];
        return m.dim ? units[m.dim] : null;
    };
    const shown = (rule) => {
        const u = unitOf(rule.metric);
        const v = u ? u.f(rule.value) : rule.value;
        return Number(v.toFixed(2));
    };

    const patch = (id, changes) =>
        setRules(rules.map((r) => (r.id === id ? { ...r, ...changes } : r)));

    const setValue = (rule, text) => {
        const v = parseFloat(text);
        if (!Number.isFinite(v)) return;
        const u = unitOf(rule.metric);
        patch(rule.id, { value: u ? u.inv(v) : v });
    };

    const add = () =>
        setRules([
            ...rules,
            { id: `r-${Date.now()}`, metric: "temperature", op: ">=", value: 30, on: true },
        ]);

    return (
        <div className="wxp-modal" onClick={onClose} role="dialog" aria-modal="true">
            <div className="wxp-modal__box wxp-alertpanel" onClick={(e) => e.stopPropagation()}>
                <header className="wxp-modal__head">
                    <h3>{T.title}</h3>
                    <button className="wxp-icon-btn" onClick={onClose} aria-label={T.close}>
                        <X size={14} />
                    </button>
                </header>
                <p className="wxp-modal__hint">{T.help}</p>

                <ul className="wxp-rules">
                    {rules.map((rule) => (
                        <li key={rule.id} className={rule.on ? "" : "is-off"}>
                            <input
                                type="checkbox"
                                checked={rule.on}
                                onChange={(e) => patch(rule.id, { on: e.target.checked })}
                                aria-label={T.enabled}
                            />
                            <select
                                value={rule.metric}
                                onChange={(e) => {
                                    // keep the same number on screen, re-based to the new unit
                                    const next = e.target.value;
                                    const nu = ALERT_METRICS[next].dim
                                        ? units[ALERT_METRICS[next].dim]
                                        : null;
                                    patch(rule.id, {
                                        metric: next,
                                        value: nu ? nu.inv(shown(rule)) : shown(rule),
                                    });
                                }}
                            >
                                {Object.keys(ALERT_METRICS).map((m) => (
                                    <option key={m} value={m}>
                                        {T.metrics[m]}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={rule.op}
                                onChange={(e) => patch(rule.id, { op: e.target.value })}
                            >
                                <option value=">=">≥</option>
                                <option value="<=">≤</option>
                            </select>
                            <input
                                type="number"
                                step="any"
                                defaultValue={shown(rule)}
                                key={`${rule.id}-${unitOf(rule.metric)?.u}-${rule.metric}`}
                                onBlur={(e) => setValue(rule, e.target.value)}
                            />
                            <span className="wxp-rules__unit">
                                {unitOf(rule.metric)?.u ?? ALERT_METRICS[rule.metric].unit}
                            </span>
                            <button
                                className="wxp-icon-btn"
                                onClick={() => setRules(rules.filter((r) => r.id !== rule.id))}
                                aria-label={T.remove}
                            >
                                <Trash2 size={13} />
                            </button>
                        </li>
                    ))}
                </ul>

                <button className="wxp-retry" onClick={add}>
                    <Plus size={13} /> {T.add}
                </button>
            </div>
        </div>
    );
}
