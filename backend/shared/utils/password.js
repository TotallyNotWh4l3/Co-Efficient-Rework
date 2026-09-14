
// ===================================================
// ファイル名: password.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: パスワードヘルパー関数
// ===================================================

import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

async function hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
}

async function comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

export default {
    hashPassword,
    comparePassword,
};
