// ===================================================
// ファイル名: 001_create_users.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ユーザーテーブルを作成するマイグレーション
// ===================================================


import usersSchema from "../../../modules/auth/users.schema.js";

export default function createUsersTable(db) {
    return new Promise((resolve, reject) => {
        db.exec(usersSchema, (error) => {
            if (error) {
                reject(error);
                return;
            }

            resolve();
        });
    });
}