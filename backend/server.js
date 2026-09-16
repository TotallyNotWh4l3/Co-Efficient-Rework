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
import helmet from "helmet";

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

app.use(helmet());

// In production the frontend is served statically by this same Express
// process (see below), so it's same-origin and needs no CORS at all.
// In dev the Vite dev server runs on its own port (default 5173) and is
// opened to the LAN via `server.host: true`, so its origin varies by
// device IP — rather than reflecting every origin, allow any origin on
// port 5173 specifically. Override with ALLOWED_ORIGINS (comma-separated)
// for anything more specific.
const isProduction = process.env.NODE_ENV === "production";
const explicitOrigins = process.env.ALLOWED_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const corsOptions = isProduction
    ? { origin: false }
    : {
          origin: explicitOrigins?.length > 0 ? explicitOrigins : /^https?:\/\/[^/]+:5173$/,
      };

app.use(cors(corsOptions));
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
