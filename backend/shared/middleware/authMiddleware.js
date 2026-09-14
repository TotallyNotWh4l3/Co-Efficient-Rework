// ===================================================
// ファイル名: authMiddleware.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 認証ミドルウェア
// ===================================================


// authMiddleware.js
import JWT from "../utils/jwt.js";

function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Authorization header missing or malformed.",
        });
    }

    const token = authHeader.split(" ")[1]?.trim();

    if (!token) {
        return res.status(401).json({ message: "Token missing." });
    }

    try {
        const user = JWT.verifyToken(token);
        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({
            message: "Invalid or expired token.",
        });
    }
}

export default authenticate;
