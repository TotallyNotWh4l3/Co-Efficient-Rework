// ===================================================
// ファイル名: ThemePreview.jsx
// 概要: テーマ編集のライブプレビュー コンポーネント
//       色の変更をその場でミニダッシュボードに反映する
// ===================================================

import { Cloud, Calendar, Bell, Settings as SettingsIcon } from "lucide-react";
import { useLanguage } from "../settings/useLanguage";
import { themeValuesToCssVars } from "./utils/colorUtils";
import "./theme-preview.css";

export default function ThemePreview({ colors, shadows }) {
    const t = useLanguage().settings.interface.appearance.dialog.preview;

    // Scoped to this container only — colors/shadows here are the dialog's
    // in-progress, unsaved edit state, so this never touches the real
    // theme variables applied to the rest of the app via useTheme.js.
    const previewVars = themeValuesToCssVars({ colors, shadows });

    return (
        <div className="theme-preview" style={previewVars}>
            <div className="theme-preview__label">{t.title}</div>

            <div className="theme-preview__frame">
                {/* ---- Mock dashboard header ---- */}
                <div className="theme-preview__header">
                    <div className="theme-preview__wordmark">
                        <span className="theme-preview__logo-dot" />
                        <div className="theme-preview__titles">
                            <span className="theme-preview__title">{t.appName}</span>
                            <span className="theme-preview__subtitle">{t.appSubtitle}</span>
                        </div>
                    </div>
                    <div className="theme-preview__header-icons">
                        <Bell className="theme-preview__header-icon" />
                        <SettingsIcon className="theme-preview__header-icon" />
                    </div>
                </div>

                {/* ---- Mock workspace ---- */}
                <div className="theme-preview__workspace">
                    <div className="theme-preview__card">
                        <div className="theme-preview__card-head">
                            <Cloud className="theme-preview__card-icon" />
                            <span className="theme-preview__card-title">{t.weatherTitle}</span>
                        </div>
                        <span className="theme-preview__big-stat">24°</span>
                        <span className="theme-preview__card-muted">{t.weatherHint}</span>
                    </div>

                    <div className="theme-preview__card">
                        <div className="theme-preview__card-head">
                            <Calendar className="theme-preview__card-icon" />
                            <span className="theme-preview__card-title">{t.scheduleTitle}</span>
                        </div>

                        <div className="theme-preview__event theme-preview__event--accent">
                            <span className="theme-preview__event-title">{t.eventOne}</span>
                        </div>
                        <div className="theme-preview__event">
                            <span className="theme-preview__event-title">{t.eventTwo}</span>
                        </div>

                        <div className="theme-preview__badges">
                            <span className="theme-preview__badge theme-preview__badge--success">
                                {t.badgeSuccess}
                            </span>
                            <span className="theme-preview__badge theme-preview__badge--warning">
                                {t.badgeWarning}
                            </span>
                            <span className="theme-preview__badge theme-preview__badge--error">
                                {t.badgeError}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ---- Mock text hierarchy + controls ---- */}
                <div className="theme-preview__footer">
                    <div className="theme-preview__text-samples">
                        <span className="theme-preview__text">{t.textPrimary}</span>
                        <span className="theme-preview__text-secondary">{t.textSecondary}</span>
                        <span className="theme-preview__text-muted">{t.textMuted}</span>
                    </div>

                    <div className="theme-preview__controls">
                        <input
                            className="theme-preview__input"
                            readOnly
                            value={t.inputPlaceholder}
                        />
                        <button className="theme-preview__btn theme-preview__btn--secondary">
                            {t.secondaryButton}
                        </button>
                        <button className="theme-preview__btn theme-preview__btn--primary">
                            {t.primaryButton}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
