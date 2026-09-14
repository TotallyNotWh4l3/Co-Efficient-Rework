
// ===================================================
// ファイル名: locationRoutes.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ロケーションルート — CRUD、ロケーション管理
// ===================================================

import express from "express";
import locationsController from "./locationsController.js";
import authenticate from "../../shared/middleware/authMiddleware.js";

const router = express.Router();


router.use(authenticate);

router.get("/", locationsController.getAll);
router.post("/", locationsController.create);
router.patch("/:id", locationsController.update);
router.delete("/:id", locationsController.remove);

export default router;
