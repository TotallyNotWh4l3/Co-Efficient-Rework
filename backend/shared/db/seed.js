// ===================================================
// ファイル名: seed.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: デフォルトのユーザーをデータベースにシードするスクリプト。
// ===================================================


import User from "../../modules/auth/User.js";
import Password from "../utils/password.js";

const USERS_TO_SEED = [
    { username: "admin", password: "admin", role: "admin" },

    { username: "manager1", password: "password", role: "manager" },
    { username: "manager2", password: "password", role: "manager" },

    { username: "user1", password: "password", role: "user" },
    { username: "user2", password: "password", role: "user" },
];

async function seed() {
    try {
        for (const { username, password, role } of USERS_TO_SEED) {
            const existingUser = await User.findByUsername(username);

            if (existingUser) {
                console.log(`${username} already exists, skipping.`);
                continue;
            }

            const passwordHash = await Password.hashPassword(password);
            const userId = await User.create(username, passwordHash, role);

            console.log(`${role} user created: ${username} (ID: ${userId})`);
        }
    } catch (error) {
        console.error(error);
    }

    process.exit();
}

seed();
