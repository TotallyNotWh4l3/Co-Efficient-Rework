// ===================================================
// ファイル名: transitRoutes.js
// 作成日: 2026/09/30
// 作成者: ゴンザガ　ウェイン
// 概要: 交通ルート — 駅/バス停一覧、時刻表取得、検証エラー確認
// ===================================================

import express from "express";

import { listStops, getStop, listErrors } from "./transitController.js";
import authMiddleware from "../../shared/middleware/authMiddleware.js";
import requireRole from "../../shared/middleware/requireRole.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/stops", listStops);
router.get("/stops/:id", getStop);
router.get("/errors", requireRole("manager"), listErrors);

export default router;
