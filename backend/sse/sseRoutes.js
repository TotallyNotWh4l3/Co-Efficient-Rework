// ===================================================
// ファイル名: sseRoutes.js
// 概要: 全モジュール共通の単一SSEエンドポイント (/api/sse)
//       旧: 各モジュールが個別に持っていた /api/<module>/stream +
//       authenticateStream の重複実装を統合。
// ===================================================

import express from "express";

import JWT from "../shared/utils/jwt.js";
import { subscribe } from "./SSEController.js";

const router = express.Router();

// Native EventSource cannot send an Authorization header, so the stream
// takes the token as a query param instead and verifies it manually here.
// Frontend: shared/sse/RealtimeContext opens `/api/sse?token=<jwt>`.
function authenticateStream(req, res, next) {
    const token = req.query.token;
    if (!token) return res.status(401).json({ message: "Token missing." });

    try {
        req.user = JWT.verifyToken(token);
        next();
    } catch {
        res.status(401).json({ message: "Invalid or expired token." });
    }
}

router.get("/", authenticateStream, (req, res) => {
    subscribe(req.user.id, res);
});

export default router;
