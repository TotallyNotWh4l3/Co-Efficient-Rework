// ===================================================
// ファイル名: transitController.js
// 作成日: 2026/09/30
// 作成者: ゴンザガ　ウェイン
// 概要: 交通(駅・バス停)時刻表を返すAPIコントローラー。
// ===================================================

import { getTransitData } from "./transitLoader.js";

/** 駅/バス停の一覧 (時刻データなしの軽量版) */
export function listStops(req, res) {
    const { stops } = getTransitData();
    res.json(
        stops.map((s) => ({
            id: s.id,
            type: s.type,
            name: s.name,
            directions: s.directions.map((d) => ({ id: d.id, label: d.label })),
        })),
    );
}

/** 1つの駅/バス停の全時刻表 */
export function getStop(req, res) {
    const { stops } = getTransitData();
    const stop = stops.find((s) => s.id === req.params.id);
    if (!stop) return res.status(404).json({ message: "Stop not found." });
    res.json(stop);
}

/** JSONファイルの検証エラー一覧 (管理者向け) */
export function listErrors(req, res) {
    res.json(getTransitData().errors);
}
