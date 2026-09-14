
// ===================================================
// ファイル名: themeRoutes.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: テーマルート — CRUD、テーマ管理
// ===================================================

import express from "express";
import themesController from "./themesController.js";
import authenticate from "../../shared/middleware/authMiddleware.js";

const router = express.Router();


router.use(authenticate);

router.get("/", themesController.getAll);
router.post("/", themesController.create);
router.patch("/:id", themesController.update);
router.delete("/:id", themesController.remove);

export default router;
