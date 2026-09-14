// ===================================================
// ファイル名: settingsController.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ユーザー設定の管理を行うAPIコントローラー。ユーザー設定の取得、更新などの機能を提供します。
// ===================================================


import UserSettings from "./UserSettings.js";

async function getSettings(req, res) {
    try {
        console.log("GET /settings hit");

        const settings = await UserSettings.findByUserId(req.user.id);

        if (!settings) {
            return res.status(404).json({
                message: "User settings not found.",
            });
        }
        return res.json(settings.settings);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Failed to load settings.",
        });
    }
}

async function updateSettings(req, res) {
    try {
        await UserSettings.upsert(req.user.id, req.body);

        res.json({
            success: true,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to save settings.",
        });
    }
}

export default {
    getSettings,
    updateSettings,
};
