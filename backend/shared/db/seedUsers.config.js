// ===================================================
// ファイル名: seedUsers.config.js
// 概要: 初期ユーザーの定義ファイル (ここを編集して使う)。
//       `npm run setup:db` または `node shared/db/seed.js` で
//       データベースに登録される。
// ===================================================
//
// HOW TO USE
// ----------
// 1. Replace the placeholder below with your own user(s).
// 2. Run `npm run setup:db` (first install) or `node shared/db/seed.js`
//    (to add users to an existing database).
//
// RULES
// -----
// - role must be one of: "admin", "manager", "user"
//     admin    full access, including user management
//     manager  manage shared content (announcements, locations, themes, ...)
//     user     view the dashboard and post announcements
// - At least ONE user with role "admin" must exist (here or already in the
//   database). The built-in locations and themes are owned by the first
//   admin account, whatever its username is.
// - username must be unique. password must be at least 8 characters.
// - The seed refuses to run while a password is still "CHANGE_ME".
// - Users that already exist (same username) are skipped: their password
//   and role are never overwritten. To change a password later, use
//   `node shared/db/resetPassword.js <username> <newPassword>` or the
//   in-app user management page.
//
// SECURITY
// --------
// Passwords here are plaintext. Don't commit real passwords to a shared
// repository. Either keep this file out of version control after editing
// (e.g. `git update-index --skip-worktree backend/shared/db/seedUsers.config.js`)
// or change the passwords right after the first login.

export default [
    // Placeholder — edit or replace this entry.
    {
        username: "admin",
        password: "CHANGE_ME",
        role: "admin",
    },

    // Add more users below, for example:
    // { username: "teacher01", password: "a-strong-password", role: "manager" },
    // { username: "student01", password: "another-strong-one", role: "user" },
];
