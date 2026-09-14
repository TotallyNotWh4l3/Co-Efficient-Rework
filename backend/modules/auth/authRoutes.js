// ===================================================
// ファイル名: authRoutes.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 認証ルート — CRUD、認証管理
// ===================================================

import express from "express";
import AuthController from "./authController.js";
import authenticate from "../../shared/middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", AuthController.login);
router.get("/me", authenticate, AuthController.me);

export default router;
