// ===================================================
// ファイル名: seedThemes.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: デフォルトのテーマをデータベースにシードする。
//       init.js から呼ばれるほか、単体でも実行できる。
// ===================================================

// backend/database/seedThemes.js
import Theme from "../../modules/themes/Theme.js";
import User from "../../modules/auth/User.js";
import { DARK_DEFAULT_THEME } from "../../../shared/constants/themes/darkDefault.js";
import { LIGHT_DEFAULT_THEME } from "../../../shared/constants/themes/lightDefault.js";
import isMain from "./isMain.js";

const DEFAULT_THEMES = [DARK_DEFAULT_THEME, LIGHT_DEFAULT_THEME];

export async function seedThemes() {
    const admin = await User.findByUsername("admin");

    if (!admin) {
        throw new Error("No 'admin' user found — seed the users first.");
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
}

if (isMain(import.meta.url)) {
    seedThemes()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}
