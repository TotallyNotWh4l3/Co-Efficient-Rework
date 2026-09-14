
// ===================================================
// ファイル名: geocodingRoutes.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ジオコーディングルート — CRUD、ジオコーディング管理
// ===================================================

import express from "express";
import geocodingController from "./geocodingController.js";
import authenticate from "../../shared/middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/search", geocodingController.search);
router.get("/reverse", geocodingController.reverse);

export default router;
