// ===================================================
// ファイル名: jwt.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: JSON Web Token ヘルパー関数
// ===================================================


import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

function generateToken(user) {
    return jwt.sign(
        {
            id: user.id,
            username: user.username,
            role: user.role,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "24h",
        },
    );
}

function verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
}

export default {
    generateToken,
    verifyToken,
};
