// ===================================================
// ファイル名: seed.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 初期ユーザーをデータベースにシードする。
//       ユーザー定義は seedUsers.config.js に分離されている。
//       init.js から呼ばれるほか、単体でも実行できる。
//       何度実行しても安全 (既存ユーザーは変更しない)。
// ===================================================

import User from "../../modules/auth/User.js";
import Password from "../utils/password.js";
import isMain from "./isMain.js";
import USERS_TO_SEED from "./seedUsers.config.js";

const CONFIG_FILE = "backend/shared/db/seedUsers.config.js";

// Keep in sync with VALID_ROLES in modules/users/userController.js.
const VALID_ROLES = ["user", "manager", "admin"];

// Same minimum the admin "set password" API enforces.
const MIN_PASSWORD_LENGTH = 8;

// The value shipped in seedUsers.config.js. Seeding with it would create an
// account with a publicly known password, so it is rejected outright.
const PLACEHOLDER_PASSWORD = "CHANGE_ME";

/**
 * Checks seedUsers.config.js and returns a cleaned-up copy (trimmed
 * usernames, lowercase roles). Throws ONE error listing every problem so the
 * file can be fixed in a single pass. Touches no database, so init.js can
 * call it before creating anything.
 */
export function loadSeedUsers(users = USERS_TO_SEED) {
    if (!Array.isArray(users) || users.length === 0) {
        throw new Error(`${CONFIG_FILE} must export a non-empty array of users.`);
    }

    const problems = [];
    const seen = new Set();
    const cleaned = [];

    users.forEach((entry, index) => {
        const name = typeof entry?.username === "string" ? entry.username.trim() : "";
        const label = `Entry #${index + 1}${name ? ` ("${name}")` : ""}`;
        const role = typeof entry?.role === "string" ? entry.role.trim().toLowerCase() : "";
        const password = entry?.password;

        if (!name) {
            problems.push(`${label}: username is missing or empty.`);
        } else if (seen.has(name)) {
            problems.push(`${label}: duplicate username.`);
        } else {
            seen.add(name);
        }

        if (!VALID_ROLES.includes(role)) {
            problems.push(`${label}: role must be one of ${VALID_ROLES.join(", ")}.`);
        }

        if (typeof password !== "string" || password.length === 0) {
            problems.push(`${label}: password is missing.`);
        } else if (password === PLACEHOLDER_PASSWORD) {
            problems.push(
                `${label}: password is still the placeholder "${PLACEHOLDER_PASSWORD}" — set a real one.`,
            );
        } else if (password.length < MIN_PASSWORD_LENGTH) {
            problems.push(`${label}: password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
        }

        cleaned.push({ username: name, password, role });
    });

    if (problems.length > 0) {
        throw new Error(
            `Invalid ${CONFIG_FILE}:\n${problems.map((problem) => `  - ${problem}`).join("\n")}`,
        );
    }

    return cleaned;
}

export async function seedUsers() {
    const users = loadSeedUsers();

    let created = 0;
    let skipped = 0;

    for (const { username, password, role } of users) {
        const existingUser = await User.findByUsername(username);

        if (existingUser) {
            const roleNote =
                existingUser.role !== role
                    ? ` (kept role "${existingUser.role}"; config says "${role}")`
                    : "";
            console.log(`${username} already exists, skipping${roleNote}.`);
            skipped++;
            continue;
        }

        const passwordHash = await Password.hashPassword(password);
        const userId = await User.create(username, passwordHash, role);

        console.log(`${role} user created: ${username} (ID: ${userId})`);
        created++;
    }

    // Built-in locations and themes are owned by the first admin, so the
    // database must end up with at least one.
    const admin = await User.findFirstByRole("admin");

    if (!admin) {
        throw new Error(
            `No user with role "admin" exists. Add one to ${CONFIG_FILE} and run the seed again.`,
        );
    }

    console.log(`[Seed] Users: ${created} created, ${skipped} already existed.`);
}

if (isMain(import.meta.url)) {
    seedUsers()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error.message);
            process.exit(1);
        });
}
