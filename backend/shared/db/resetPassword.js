// ===================================================
// ファイル名: resetPassword.js
// 概要: CLIから任意ユーザーのパスワードを直接リセットするスクリプト
//       SQLite Viewerの編集機能(Pro版限定)を使わずに済むようにするための代替手段
// 使い方: node shared/db/resetPassword.js <username> <newPassword>
// ===================================================

import User from "../../modules/auth/User.js";
import Password from "../utils/password.js";

async function main() {
    const [, , username, newPassword] = process.argv;

    if (!username || !newPassword) {
        console.error("Usage: node shared/db/resetPassword.js <username> <newPassword>");
        process.exit(1);
    }

    if (newPassword.length < 4) {
        console.error("Password too short — pick something you'll actually remember this time.");
        process.exit(1);
    }

    const user = await User.findByUsername(username);
    if (!user) {
        console.error(`No user found with username "${username}".`);
        process.exit(1);
    }

    const passwordHash = await Password.hashPassword(newPassword);
    await User.updatePassword(user.id, passwordHash);

    console.log(`Password for "${username}" (ID: ${user.id}) has been reset.`);
    process.exit(0);
}

main().catch((err) => {
    console.error("Failed to reset password:", err);
    process.exit(1);
});
