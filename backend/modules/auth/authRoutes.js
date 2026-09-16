// ===================================================
// ファイル名: authRoutes.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 認証ルート — CRUD、認証管理
// ===================================================

import express from "express";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import AuthController from "./authController.js";
import authenticate from "../../shared/middleware/authMiddleware.js";

const router = express.Router();

// No req.user yet at this point, so key by IP. Capped fairly tight since a
// real user mistyping a password a handful of times is normal, but a script
// trying usernames/passwords in a loop is not — 10 attempts/5 min/IP.
const loginLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(req.ip),
    message: { message: "Too many login attempts — please wait a few minutes and try again." },
});

router.post("/login", loginLimiter, AuthController.login);
router.get("/me", authenticate, AuthController.me);

export default router;
