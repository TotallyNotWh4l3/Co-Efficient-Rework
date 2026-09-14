// ===================================================
// ファイル名: server.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: サーバーのエントリーポイント (フルローカル版)
// ===================================================

import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import "./shared/db/database.js";

import authRoutes from "./modules/auth/authRoutes.js";
import settingsRoutes from "./modules/settings/settingsRoutes.js";
import weatherRoutes from "./modules/weather/weatherRoutes.js";
import { startWeatherScheduler } from "./modules/weather/weatherScheduler.js";
import announcementRoutes from "./modules/announcements/announcementRoutes.js";
import locationRoutes from "./modules/locations/locationRoutes.js";
import dashboardRoutes from "./modules/dashboard/dashboardRoutes.js";
import scheduleRoutes from "./modules/schedule/scheduleRoutes.js";
import geocodingRoutes from "./modules/geocoding/geocodingRoutes.js";
import themeRoutes from "./modules/themes/themeRoutes.js";
import userRoutes from "./modules/users/userRoutes.js";

import sseRoutes from "./sse/sseRoutes.js";

import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, ".env") });

app.use(cors());
app.use(express.json());

// Single central SSE channel for every module's realtime push.
app.use("/api/sse", sseRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/geocoding", geocodingRoutes);
app.use("/api/themes", themeRoutes);
app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 3001;

// Serve built frontend
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// Catch-all for client-side routing (keep this AFTER your /api routes)
app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running!`);
    console.log(`Local:   http://localhost:${PORT}`);
    console.log(`Network: http://YOUR_LOCAL_IP:${PORT}`);
    startWeatherScheduler();
});
