
// ===================================================
// ファイル名: userRoutes.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ユーザールート — CRUD、ロール管理
// ===================================================

import express from "express";
import UserController from "./userController.js";
import authenticate from "../../shared/middleware/authMiddleware.js";
import requireRole from "../../shared/middleware/requireRole.js";

const router = express.Router();

router.use(authenticate, requireRole("admin"));

router.get("/", UserController.list);
router.post("/", UserController.create);
router.patch("/:id/role", UserController.updateRole);
router.patch("/:id/password", UserController.updatePassword);
router.delete("/:id", UserController.remove);

export default router;
