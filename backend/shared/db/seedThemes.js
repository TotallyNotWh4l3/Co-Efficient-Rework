// ===================================================
// ファイル名: seedThemes.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: デフォルトのテーマをデータベースにシードするスクリプト。
// ===================================================


// backend/database/seedThemes.js
import Theme from "../../modules/themes/Theme.js";
import User from "../../modules/auth/User.js";
import { DARK_DEFAULT_THEME } from "../../../shared/constants/themes/darkDefault.js";
import { LIGHT_DEFAULT_THEME } from "../../../shared/constants/themes/lightDefault.js";

const DEFAULT_THEMES = [DARK_DEFAULT_THEME, LIGHT_DEFAULT_THEME];

async function seed() {
    try {
        const admin = await User.findByUsername("admin");

        if (!admin) {
            console.error("No 'admin' user found — run the admin seed script first.");
            process.exit(1);
        }

        const existing = await Theme.findAll();
        const existingIds = new Set(existing.map((theme) => theme.id));

        for (const theme of DEFAULT_THEMES) {
            if (existingIds.has(theme.id)) {
                console.log(`${theme.name} already exists, skipping.`);
                continue;
            }

            await Theme.create({
                id: theme.id,
                userId: admin.id,
                name: theme.name,
                builtIn: true,
                basedOn: null,
                appearance: theme.appearance,
            });

            console.log(`Created built-in theme: ${theme.name} (ID: ${theme.id})`);
        }
    } catch (error) {
        console.error(error);
    }

    process.exit();
}

seed();
