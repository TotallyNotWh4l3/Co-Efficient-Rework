// ===================================================
// ファイル名: devAuthRoutes.js
// 作成日: 2026/11/20
// 概要: 開発専用のクイックログイン（パスワード無しでログイン）
//       backend/.env の DEV_QUICK_LOGIN=true のときだけ有効。
//       それ以外は全リクエストに 404 を返し、存在しないものとして扱う。
// ===================================================

import express from "express";
import User from "./User.js";
import { issueSession } from "./authController.js";

// Read lazily (per request) rather than at import time: server.js loads
// backend/.env *after* its imports are evaluated, so a top-level read here
// could see the flag as unset.
export function isDevQuickLoginEnabled() {
    return (
        process.env.NODE_ENV !== "production" &&
        String(process.env.DEV_QUICK_LOGIN ?? "").toLowerCase() === "true"
    );
}

const router = express.Router();

// Gate: when the flag is off these routes behave as if they don't exist.
router.use((req, res, next) => {
    if (!isDevQuickLoginEnabled()) {
        return res.status(404).json({ message: "Not found." });
    }
    next();
});

// Everyone the login screen can offer as a one-click account.
router.get("/users", async (req, res) => {
    try {
        res.json(await User.findAll());
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error." });
    }
});

// Body: { userId } for a specific account, or { role: "admin" } for the
// oldest account with that role (the "Login as admin" button).
router.post("/login", async (req, res) => {
    try {
        const { userId, role } = req.body ?? {};

        let user;
        if (userId !== undefined) {
            user = await User.findById(Number(userId));
        } else if (typeof role === "string") {
            user = await User.findFirstByRole(role);
        } else {
            return res.status(400).json({ message: "userId or role is required." });
        }

        if (!user) {
            return res.status(404).json({ message: "No matching user." });
        }

        console.warn(`[Auth] DEV quick-login as "${user.username}" (${user.role})`);
        res.json(await issueSession(user));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error." });
    }
});

export default router;
