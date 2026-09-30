
// ===================================================
// ファイル名: AboutSettings.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: アプリについての設定ページ
// ===================================================

import "./about-settings.css";

import { Info, RotateCcw } from "lucide-react";

import { useSettings } from "../useSettings";
import { useDialog } from "../../../shared/dialog/useDialog";
import { useLanguage } from "../useLanguage";

import Settings from "../components/SettingsComponents";

const APP_VERSION = "Beta 1.0.0";

const TECH_STACK = [
    { name: "React", role: "frontend" },
    { name: "Express", role: "backend" },
    { name: "Node.js", role: "runtime" },
    { name: "libSQL / SQLite", role: "database" },
    { name: "Vercel", role: "hosting" },
    { name: "Turso", role: "database hosting" },
];

export default function AboutSettings() {
    const { resetToDefaults } = useSettings();
    const { openDialog } = useDialog();

    const T = useLanguage();
    const copy = T?.settings?.about ?? {};
    const stackRoles = copy.stack?.roles ?? {};

    const handleReset = () => {
        openDialog({
            type: "confirm",
            props: {
                title: copy.resetTitle,
                description:
                    copy.resetMessage,
                confirmText: copy.resetConfirm,
                danger: true,
                onConfirm: () => resetToDefaults(),
            },
        });
    };

    return (
        <div className="about-settings">
            <Settings.Title Icon={Info}>{copy.title}</Settings.Title>

            <Settings.Description>
                {copy.description}
            </Settings.Description>

            <Settings.Divider mod="thick" />

            <Settings.Section>
                <Settings.SectionTitle>{copy.versionTitle}</Settings.SectionTitle>

                <Settings.Row>
                    <Settings.RowContent>
                        <Settings.RowLabel>Co:Efficient</Settings.RowLabel>
                        <Settings.RowDescription>{APP_VERSION}</Settings.RowDescription>
                    </Settings.RowContent>
                </Settings.Row>
            </Settings.Section>

            <Settings.Divider />

            <Settings.Section>
                <Settings.SectionTitle>{copy.stack?.title}</Settings.SectionTitle>
                <Settings.Description>
                    {copy.stack?.description}
                </Settings.Description>

                {TECH_STACK.map((tech) => (
                    <Settings.Row key={tech.name}>
                        <Settings.RowContent>
                            <Settings.RowLabel>{tech.name}</Settings.RowLabel>
                            <Settings.RowDescription>
                                {stackRoles[tech.role] ?? tech.role}
                            </Settings.RowDescription>
                        </Settings.RowContent>
                    </Settings.Row>
                ))}
            </Settings.Section>

            <Settings.Divider />

            <Settings.Section>
                <Settings.SectionTitle>{copy.resetSectionTitle}</Settings.SectionTitle>

                <Settings.Description>
                    {copy.resetSectionDescription}
                </Settings.Description>

                <Settings.Button variant="secondary" onClick={handleReset}>
                    <RotateCcw size={16} />
                    {copy.resetButton}
                </Settings.Button>
            </Settings.Section>
        </div>
    );
}
