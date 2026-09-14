
// ===================================================
// ファイル名: weatherRoutes.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: 天気ルート — CRUD、天気情報取得
// ===================================================

import express from "express";

import { getWeatherController } from "./weatherController.js";
import authMiddleware from "../../shared/middleware/authMiddleware.js";

const router = express.Router();

router.get("/test", (req, res) => {
    res.json({ message: "Weather route works!" });
});

router.get("/", authMiddleware, getWeatherController);

export default router;
