// ===================================================
// ファイル名: requireRole.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ロール要件ミドルウェア
// ===================================================


const ROLE_RANK = { user: 0, manager: 1, admin: 2 };

function requireRole(minRole) {
    const minRank = ROLE_RANK[minRole] ?? Infinity;

    return function (req, res, next) {
        const userRank = ROLE_RANK[req.user?.role?.toLowerCase()] ?? -1;

        if (userRank < minRank) {
            return res.status(403).json({
                message: "You do not have permission to perform this action.",
            });
        }

        next();
    };
}

export default requireRole;
