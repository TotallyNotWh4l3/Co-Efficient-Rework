// ===================================================
// ファイル名: userController.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ユーザーの管理を行うAPIコントローラー。ユーザーの作成、更新、削除、および取得などの機能を提供します。
// ===================================================


import User from "../auth/User.js";
import Password from "../../shared/utils/password.js";

const VALID_ROLES = ["user", "manager", "admin"];

async function list(req, res) {
    try {
        const users = await User.findAll();
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error." });
    }
}

async function create(req, res) {
    try {
        const { username, password, role } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: "Username and password are required.",
            });
        }

        if (role && !VALID_ROLES.includes(role)) {
            return res.status(400).json({ message: "Invalid role." });
        }

        const existing = await User.findByUsername(username);
        if (existing) {
            return res.status(409).json({ message: "Username already exists." });
        }

        const passwordHash = await Password.hashPassword(password);
        const newId = await User.create(username, passwordHash, role || "user");
        const created = await User.findById(newId);

        res.status(201).json({
            id: created.id,
            username: created.username,
            role: created.role,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error." });
    }
}

async function updateRole(req, res) {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!VALID_ROLES.includes(role)) {
            return res.status(400).json({ message: "Invalid role." });
        }

        if (Number(id) === req.user.id) {
            return res.status(400).json({ message: "You cannot change your own role." });
        }

        const changes = await User.updateRole(id, role);
        if (!changes) {
            return res.status(404).json({ message: "User not found." });
        }

        res.json({ message: "Role updated." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error." });
    }
}

// Admin-only: set a user's password directly (no knowledge of the old
// password required — this is an administrative override, not a
// self-service "change my password" flow).
async function updatePassword(req, res) {
    try {
        const { id } = req.params;
        const { password } = req.body;

        if (!password || password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters.",
            });
        }

        const target = await User.findById(id);
        if (!target) {
            return res.status(404).json({ message: "User not found." });
        }

        const passwordHash = await Password.hashPassword(password);
        await User.updatePassword(id, passwordHash);

        res.json({ message: "Password updated." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error." });
    }
}

async function remove(req, res) {
    try {
        const { id } = req.params;

        if (Number(id) === req.user.id) {
            return res.status(400).json({ message: "You cannot delete your own account." });
        }

        const changes = await User.deleteById(id);
        if (!changes) {
            return res.status(404).json({ message: "User not found." });
        }

        res.json({ message: "User deleted." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error." });
    }
}

export default {
    list,
    create,
    updateRole,
    updatePassword,
    remove,
};
