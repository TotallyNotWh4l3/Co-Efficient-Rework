// ===================================================
// ファイル名: announcementRoutes.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: お知らせルート — CRUD、アーカイブ、既読管理、SSEストリーム
// ===================================================

import express from "express";
import announcementController from "./announcementController.js";
import authenticate from "../../shared/middleware/authMiddleware.js";

const router = express.Router();


// Everything else uses the normal header-based auth.
router.use(authenticate);

router.get("/recent", announcementController.getRecent);
router.get("/archive", announcementController.getArchived);
router.get("/sync", announcementController.getSince);
router.get("/unread-count", announcementController.getUnreadCount);
router.get("/:id/logs", announcementController.getLogs);
router.get("/", announcementController.getAll);

router.post("/", announcementController.create);
router.patch("/:id", announcementController.update);
router.delete("/:id", announcementController.remove);
router.post("/:id/archive", announcementController.archiveNow);
router.post("/:id/restore", announcementController.restore);
router.post("/:id/read", announcementController.markRead);

export default router;
