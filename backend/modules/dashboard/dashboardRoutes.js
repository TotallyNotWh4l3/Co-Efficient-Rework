// ===================================================
// ファイル名: dashboardRoutes.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ダッシュボードルート — CRUD、ダッシュボード管理
// ===================================================

import express from "express";
import dashboardController from "./dashboardController.js";
import authenticate from "../../shared/middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/", dashboardController.getState);
router.patch("/layout", dashboardController.updateLayout);
router.post("/modules", dashboardController.addModule);
router.delete("/modules/:id", dashboardController.removeModule);
router.patch("/modules/:id/settings", dashboardController.updateModuleSettings);
router.patch("/modules/:id/layout", dashboardController.updateModuleLayout);

export default router;
