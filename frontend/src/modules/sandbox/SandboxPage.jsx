// ===================================================
// ファイル名: SandboxPage.jsx
// 作成日: 2026/11/20
// 概要: 開発用サンドボックスページ（サイドバー「サンドボックス」セクション）
//       各種Reactライブラリのコンポーネントを試すための場所。
//       playground/ にファイルを追加するだけで一覧に表示される。
// ===================================================

import { useMemo, useState } from "react";
import { FlaskConical, Search, RotateCcw, Monitor, Tablet, Smartphone } from "lucide-react";

import { useLanguage } from "../settings/useLanguage";
import SandboxErrorBoundary from "./SandboxErrorBoundary";
import { SANDBOX_ENTRIES, groupByLibrary } from "./registry";

import "./sandbox-page.css";

const SELECTED_STORAGE_KEY = "co-efficient-sandbox-selected";

const BACKGROUNDS = ["surface", "base", "checker"];
const WIDTHS = [
    { id: "full", icon: Monitor },
    { id: "tablet", icon: Tablet },
    { id: "mobile", icon: Smartphone },
];

// Remembering the last-opened entry means a reload (or an HMR full
// reload after editing a playground file) lands back on what you were
// testing instead of an empty stage.
function readSelected() {
    try {
        return localStorage.getItem(SELECTED_STORAGE_KEY);
    } catch {
        return null;
    }
}

function writeSelected(id) {
    try {
        localStorage.setItem(SELECTED_STORAGE_KEY, id);
    } catch {
        // Storage unavailable — selection just won't survive a reload.
    }
}

export default function SandboxPage() {
    const T = useLanguage().sandboxPage;

    const [query, setQuery] = useState("");
    const [selectedId, setSelectedId] = useState(() => {
        const stored = readSelected();
        return SANDBOX_ENTRIES.some((e) => e.id === stored)
            ? stored
            : (SANDBOX_ENTRIES[0]?.id ?? null);
    });
    const [background, setBackground] = useState("surface");
    const [width, setWidth] = useState("full");
    const [resetKey, setResetKey] = useState(0);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return SANDBOX_ENTRIES;
        return SANDBOX_ENTRIES.filter((e) =>
            `${e.library} ${e.name} ${e.description}`.toLowerCase().includes(q),
        );
    }, [query]);

    const groups = useMemo(() => groupByLibrary(filtered), [filtered]);
    const selected = SANDBOX_ENTRIES.find((e) => e.id === selectedId) ?? null;
    const Selected = selected?.component;

    const handleSelect = (id) => {
        setSelectedId(id);
        setResetKey((k) => k + 1);
        writeSelected(id);
    };

    return (
        <div className="sandbox">
            {/* ===== Entry list ===== */}
            <aside className="sandbox__list">
                <div className="sandbox__list-top">
                    <div className="sandbox__title">
                        <FlaskConical size={16} />
                        <span>{T.title}</span>
                    </div>

                    <label className="sandbox__search">
                        <Search size={14} />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={T.searchPlaceholder}
                        />
                    </label>
                </div>

                <div className="sandbox__groups">
                    {groups.map((group) => (
                        <div key={group.library} className="sandbox__group">
                            <div className="sandbox__group-label">{group.library}</div>
                            {group.entries.map((entry) => (
                                <button
                                    key={entry.id}
                                    className={`sandbox__entry${
                                        entry.id === selectedId ? " sandbox__entry--active" : ""
                                    }`}
                                    onClick={() => handleSelect(entry.id)}
                                    title={entry.description}
                                >
                                    {entry.name}
                                </button>
                            ))}
                        </div>
                    ))}

                    {groups.length === 0 && (
                        <p className="sandbox__list-empty">
                            {SANDBOX_ENTRIES.length === 0 ? T.empty : T.noResults}
                        </p>
                    )}
                </div>

                <div className="sandbox__list-footer">
                    {SANDBOX_ENTRIES.length} {T.count}
                </div>
            </aside>

            {/* ===== Preview ===== */}
            <section className="sandbox__preview">
                <div className="sandbox__toolbar">
                    <div className="sandbox__heading">
                        <h2 className="sandbox__name">{selected?.name ?? T.noSelection}</h2>
                        {selected && (
                            <p className="sandbox__meta">
                                {selected.library}
                                {selected.description ? ` — ${selected.description}` : ""}
                            </p>
                        )}
                    </div>

                    <div className="sandbox__controls">
                        <div className="sandbox__segmented" role="group" aria-label={T.background.label}>
                            {BACKGROUNDS.map((id) => (
                                <button
                                    key={id}
                                    className={`sandbox__seg-btn${
                                        background === id ? " sandbox__seg-btn--active" : ""
                                    }`}
                                    onClick={() => setBackground(id)}
                                >
                                    {T.background[id]}
                                </button>
                            ))}
                        </div>

                        <div className="sandbox__segmented" role="group" aria-label={T.width.label}>
                            {WIDTHS.map(({ id, icon: Icon }) => (
                                <button
                                    key={id}
                                    className={`sandbox__seg-btn${
                                        width === id ? " sandbox__seg-btn--active" : ""
                                    }`}
                                    onClick={() => setWidth(id)}
                                    title={T.width[id]}
                                    aria-label={T.width[id]}
                                >
                                    <Icon size={14} />
                                </button>
                            ))}
                        </div>

                        <button
                            className="sandbox__icon-btn"
                            onClick={() => setResetKey((k) => k + 1)}
                            title={T.reset}
                            aria-label={T.reset}
                            disabled={!selected}
                        >
                            <RotateCcw size={14} />
                        </button>
                    </div>
                </div>

                <div className={`sandbox__stage sandbox__stage--${background}`}>
                    {Selected ? (
                        <div className={`sandbox__frame sandbox__frame--${width}`}>
                            <SandboxErrorBoundary key={`${selectedId}-${resetKey}`} title={T.crashed}>
                                <Selected />
                            </SandboxErrorBoundary>
                        </div>
                    ) : (
                        <p className="sandbox__stage-empty">{T.emptyHint}</p>
                    )}
                </div>
            </section>
        </div>
    );
}
