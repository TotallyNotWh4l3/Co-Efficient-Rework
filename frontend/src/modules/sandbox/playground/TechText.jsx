// ===================================================
// ファイル名: TechText.jsx
// 作成日: 2026/11/20
// 概要: React Bits「TechText」のサンドボックス用サンプル
//       主要なpropsをコントロールで切り替えて動作を確認できる。
// ===================================================

import { useState } from "react";
import TechText from "../../../component/TechText";

export const meta = {
    library: "React Bits",
    name: "Tech Text",
    description: "Canvas text: hover/drag letters, reveal, intro animations",
};

const REVEALS = ["letter", "area"];
const INTROS = ["none", "type", "assemble", "metrics"];
const LINE_STYLES = ["dashed", "solid"];

const rowStyle = {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "0.75rem 1.25rem",
    fontSize: "0.8125rem",
    color: "var(--color-text-secondary)",
};

const fieldStyle = { display: "inline-flex", alignItems: "center", gap: "0.375rem" };

const inputStyle = {
    padding: "0.25rem 0.5rem",
    background: "var(--color-input-bg)",
    color: "var(--color-text)",
    border: "1px solid var(--color-border)",
    borderRadius: "0.375rem",
    font: "inherit",
};

function Select({ label, value, options, onChange }) {
    return (
        <label style={fieldStyle}>
            {label}
            <select style={inputStyle} value={value} onChange={(e) => onChange(e.target.value)}>
                {options.map((o) => (
                    <option key={o} value={o}>
                        {o}
                    </option>
                ))}
            </select>
        </label>
    );
}

function Check({ label, value, onChange }) {
    return (
        <label style={fieldStyle}>
            <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
            {label}
        </label>
    );
}

function Range({ label, value, min, max, step, onChange }) {
    return (
        <label style={fieldStyle}>
            {label} {value}
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
            />
        </label>
    );
}

export default function Demo() {
    const [text, setText] = useState("React Bits");
    const [reveal, setReveal] = useState("letter");
    const [intro, setIntro] = useState("none");
    const [lineStyle, setLineStyle] = useState("dashed");
    const [guides, setGuides] = useState(false);
    const [labels, setLabels] = useState(true);
    const [selection, setSelection] = useState(true);
    const [draggable, setDraggable] = useState(true);
    const [sweep, setSweep] = useState(true);
    const [clickKick, setClickKick] = useState(true);
    const [bounce, setBounce] = useState(0.4);
    const [specks, setSpecks] = useState(15);
    const [reach, setReach] = useState(200);

    // Bumping this remounts the component, which replays the intro.
    const [replay, setReplay] = useState(0);

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "1rem",
            }}
        >
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                <div style={rowStyle}>
                    <label style={fieldStyle}>
                        text
                        <input
                            style={inputStyle}
                            type="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />
                    </label>
                    <Select label="reveal" value={reveal} options={REVEALS} onChange={setReveal} />
                    <Select label="intro" value={intro} options={INTROS} onChange={setIntro} />
                    <Select
                        label="lineStyle"
                        value={lineStyle}
                        options={LINE_STYLES}
                        onChange={setLineStyle}
                    />
                    <button
                        type="button"
                        style={{ ...inputStyle, cursor: "pointer" }}
                        onClick={() => setReplay((n) => n + 1)}
                    >
                        Replay intro
                    </button>
                </div>

                <div style={rowStyle}>
                    <Check label="guides" value={guides} onChange={setGuides} />
                    <Check label="labels" value={labels} onChange={setLabels} />
                    <Check label="selection" value={selection} onChange={setSelection} />
                    <Check label="draggable" value={draggable} onChange={setDraggable} />
                    <Check label="sweep" value={sweep} onChange={setSweep} />
                    <Check label="clickKick" value={clickKick} onChange={setClickKick} />
                </div>

                <div style={rowStyle}>
                    <Range
                        label="bounce"
                        value={bounce}
                        min={0}
                        max={1}
                        step={0.05}
                        onChange={setBounce}
                    />
                    <Range
                        label="specks"
                        value={specks}
                        min={0}
                        max={40}
                        step={1}
                        onChange={setSpecks}
                    />
                    <Range
                        label="reach"
                        value={reach}
                        min={80}
                        max={400}
                        step={10}
                        onChange={setReach}
                    />
                </div>
            </div>

            {/* TechText fills its parent and reads the parent's text colour and
                font, so give it an explicit height and set both here. */}
            <div
                style={{
                    height: "22rem",
                    color: "var(--color-text)",
                    border: "1px dashed var(--color-border)",
                    borderRadius: "0.5rem",
                }}
            >
                <TechText
                    key={replay}
                    text={text}
                    reveal={reveal}
                    intro={intro}
                    lineStyle={lineStyle}
                    guides={guides}
                    labels={labels}
                    selection={selection}
                    draggable={draggable}
                    sweep={sweep}
                    clickKick={clickKick}
                    bounce={bounce}
                    specks={specks}
                    reach={reach}
                    fontFamily="ui-sans-serif, system-ui, sans-serif"
                />
            </div>
        </div>
    );
}
