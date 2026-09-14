// ===================================================
// ファイル名: SettingsComponents.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 設定コンポーネント
// ===================================================


import { ChevronDown } from "lucide-react";
import "./settings-components.css";

function Title({ children, Icon = null, className = "" }) {
    return (
        <header className={`settings__header ${className}`}>
            {Icon && <Icon size={20} />}
            <h1 className="settings__title">{children}</h1>
        </header>
    );
}

function Description({ children, Icon = null, className = "" }) {
    return (
        <div className={`settings__description-wrapper ${className}`}>
            {Icon && <Icon size={16} className="settings__description-icon" />}

            <p className="settings__description">{children}</p>
        </div>
    );
}

function Section({ children, className = "" }) {
    return <section className={`settings__section ${className}`}>{children}</section>;
}

function SectionTitle({ children, className = "" }) {
    return <h2 className={`settings__section-title ${className}`}>{children}</h2>;
}

/**
 * @param {Object} props
 * @param {'default' | 'thick' | 'dashed' | 'thin'} [props.mod='default']
 */
function Divider({ mod = "default", className = "" }) {
    return <hr className={`settings__divider settings__divider--${mod} ${className}`} />;
}

function Row({ children, className = "" }) {
    return <div className={`settings__row ${className}`}>{children}</div>;
}

function RowContent({ children, className = "" }) {
    return <div className={`settings__row-content ${className}`}>{children}</div>;
}

function RowLabel({ children, className = "" }) {
    return <span className={`settings__row-label ${className}`}>{children}</span>;
}

function RowDescription({ children, className = "" }) {
    return <p className={`settings__row-description ${className}`}>{children}</p>;
}

function Button({ children, variant = "primary", className = "", ...props }) {
    return (
        <button className={`settings__button settings__button--${variant} ${className}`} {...props}>
            {children}
        </button>
    );
}

function Select({ options = [], value, className = "", ...props }) {
    return (
        <div className={`settings__select-wrapper ${className}`}>
            <select className="settings__select" value={value} {...props}>
                {options.map((option) => (
                    <option key={option.id} value={option.id}>
                        {option.label}
                    </option>
                ))}
            </select>

            <ChevronDown className="settings__select-icon" size={16} />
        </div>
    );
}

function Switch({ checked, className = "", ...props }) {
    return (
        <label className={`settings__switch ${className}`}>
            <input
                className="settings__switch-input"
                type="checkbox"
                checked={checked}
                {...props}
            />

            <span className="settings__switch-slider" />
        </label>
    );
}

function Slider({ min = 0, max = 100, value, className = "", ...props }) {
    return (
        <input
            className={`settings__slider ${className}`}
            type="range"
            min={min}
            max={max}
            value={value}
            {...props}
        />
    );
}

function TextInput({ className = "", ...props }) {
    return <input className={`settings__text-input ${className}`} type="text" {...props} />;
}

const Settings = {
    Title,
    Description,

    Section,
    SectionTitle,
    Divider,

    Row,
    RowContent,
    RowLabel,
    RowDescription,

    Button,
    Select,
    Switch,
    Slider,
    TextInput,
};

export default Settings;
