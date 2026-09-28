// ===================================================
// ファイル名: seed.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: デフォルトのユーザーをデータベースにシードするスクリプト。
// ===================================================

import User from "../../modules/auth/User.js";
import Password from "../utils/password.js";

const USERS_TO_SEED = [
    { username: "admin", password: "coefficientadministrator", role: "admin" },

    // Instructor
    { username: "Miyamoto", password: "Instructor_Miyamoto", role: "manager" },
    { username: "Obata", password: "Instructor_Obata", role: "manager" },
    { username: "Sakurai", password: "Instructor_Sakurai", role: "manager" },
    { username: "Kasajima", password: "Instructor_Kasajima", role: "manager" },

    // Grade 1
    { username: "Iida", password: "Tsutech*101", role: "manager" },
    { username: "Kataoka", password: "Tsutech*102", role: "manager" },
    { username: "Shutou", password: "Tsutech*103", role: "manager" },
    { username: "Tatematsu", password: "Tsutech*104", role: "manager" },
    { username: "Miyazaki", password: "Tsutech*105", role: "manager" },
    { username: "Yanase", password: "Tsutech*106", role: "manager" },
    { username: "Yoshimura", password: "Tsutech*107", role: "manager" },
    { username: "Wakita", password: "Tsutech*108", role: "manager" },

    // Grade 2
    { username: "Okada", password: "Tsutech*201", role: "manager" },
    { username: "Kitagawa", password: "Tsutech*202", role: "manager" },
    { username: "Kengyouya", password: "Tsutech*203", role: "manager" },
    { username: "Gonzaga", password: "Tsutech*204", role: "manager" },
    { username: "Hayashi", password: "Tsutech*205", role: "manager" },
    { username: "Fukuoka", password: "Tsutech*206", role: "manager" },
    { username: "Murakami", password: "Tsutech*207", role: "manager" },
    { username: "Yamaoka", password: "Tsutech*208", role: "manager" },
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
