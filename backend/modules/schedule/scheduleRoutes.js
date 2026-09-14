
// ===================================================
// ファイル名: scheduleRoutes.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: スケジュールルート — CRUD、スケジュール管理
// ===================================================

import express from "express";
import scheduleController from "./scheduleController.js";
import authenticate from "../../shared/middleware/authMiddleware.js";

const router = express.Router();


router.use(authenticate);

router.get("/today", scheduleController.getToday);
router.get("/upcoming", scheduleController.getUpcoming);
router.get("/range", scheduleController.getRange);
router.get("/sync", scheduleController.getSince);
router.get("/tags", scheduleController.getTags);
router.post("/tags", scheduleController.upsertTag);
router.delete("/tags/:id", scheduleController.removeTag);
router.get("/", scheduleController.getAll);

router.post("/", scheduleController.create);
router.patch("/:id", scheduleController.update);
router.delete("/:id", scheduleController.remove);

export default router;
