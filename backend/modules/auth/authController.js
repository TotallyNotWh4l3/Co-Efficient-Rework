// ===================================================
// ファイル名: authController.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 認証関連のAPIコントローラー。ユーザーのログイン、認証トークンの生成、および現在のユーザー情報の取得などの機能を提供します。
// ===================================================


import User from "./User.js";
import UserSettings from "../settings/UserSettings.js";

import Password from "../../shared/utils/password.js";
import JWT from "../../shared/utils/jwt.js";

import { DEFAULT_SETTINGS } from "../../../shared/constants/defaults/defaultSettings.js";

async function login(req, res) {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: "Username and password are required.",
            });
        }

        const user = await User.findByUsername(username);

        if (!user) {
            return res.status(401).json({
                message: "Invalid username or password.",
            });
        }

        const validPassword = await Password.comparePassword(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({
                message: "Invalid username or password.",
            });
        }

        // -------------------------------------------------
        // Ensure the user always has a settings record
        // -------------------------------------------------

        const existingSettings = await UserSettings.findByUserId(user.id);

        if (!existingSettings) {
            console.log(`[Auth] Creating default settings for user ${user.username}`);
            await UserSettings.upsert(user.id, DEFAULT_SETTINGS);
        }

        // NOTE: locations are no longer per-user (see Location.js / locationsController.js) —
        // they're a single shared table everyone reads from, so there's nothing to
        // backfill into a user's own settings anymore.

        const token = JWT.generateToken(user);

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
            },
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal server error.",
        });
    }
}

function me(req, res) {
    res.json({
        id: req.user.id,
        username: req.user.username,
        role: req.user.role,
    });
}

export default {
    login,
    me,
};