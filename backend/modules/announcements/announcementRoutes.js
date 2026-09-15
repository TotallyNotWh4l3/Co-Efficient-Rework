// ===================================================
// ファイル名: announcementRoutes.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: お知らせルート — CRUD、アーカイブ、既読管理、SSEストリーム
// ===================================================

import express from "express";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import announcementController from "./announcementController.js";
import authenticate from "../../shared/middleware/authMiddleware.js";

const router = express.Router();

// Caps writes per user (keyed by JWT id, falls back to IP if somehow missing).
// Applies to update/delete/archive/restore, which are already role- or
// ownership-gated in the controller — this just stops any single account
// from flooding those actions.
const writeLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id?.toString() || ipKeyGenerator(req.ip),
    message: { message: "Too many announcement changes — slow down and try again shortly." },
});

// create is open to every role by design (see announcementController.js),
// so it gets its own tighter limit plus the duplicate-content cooldown in
// the controller — those two together are what actually stop a console
// script from flooding the table, since there's no role check left to
// rely on and no way to tell a scripted request from a real click.
const createLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id?.toString() || ipKeyGenerator(req.ip),
    message: { message: "Too many announcements posted — slow down and try again shortly." },
});

// Everything else uses the normal header-based auth.
router.use(authenticate);

router.get("/recent", announcementController.getRecent);
router.get("/archive", announcementController.getArchived);
router.get("/sync", announcementController.getSince);
router.get("/unread-count", announcementController.getUnreadCount);
router.get("/:id/logs", announcementController.getLogs);
router.get("/", announcementController.getAll);

// Any authenticated user (user/manager/admin) may create — intentional,
// per product requirements. update/remove/archiveNow/restore already
// enforce their own role/ownership checks inside the controller
// (canModify / isManagerOrAbove).
router.post("/", createLimiter, announcementController.create);
router.patch("/:id", writeLimiter, announcementController.update);
router.delete("/:id", writeLimiter, announcementController.remove);
router.post("/:id/archive", writeLimiter, announcementController.archiveNow);
router.post("/:id/restore", writeLimiter, announcementController.restore);
router.post("/:id/read", announcementController.markRead);

export default router;
