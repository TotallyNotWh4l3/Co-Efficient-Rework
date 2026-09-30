// ===================================================
// ファイル名: transitLoader.js
// 作成日: 2026/09/30
// 作成者: ゴンザガ　ウェイン
// 概要: backend/data/transit/ 内のJSONを読み込み、検証してメモリに保持します。
//       不正なファイルはスキップし、エラー内容(場所つき)を記録します。
// ===================================================

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { transitFileSchema } from "./transit.schema.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const TRANSIT_DATA_DIR = path.join(__dirname, "../../data/transit");

let cache = { signature: null, stops: [], errors: [] };

/** Zod の path (["stops", 0, "directions", 1, ...]) を「久居 › 名古屋方面 › ...」の形にする。 */
function describePath(raw, issuePath) {
    let node = raw;
    const parts = [];

    for (const seg of issuePath) {
        node = node?.[seg];
        if (typeof seg !== "number") {
            if (seg !== "stops" && seg !== "directions" && seg !== "services") parts.push(seg);
            continue;
        }
        const label =
            node?.name ||
            node?.label ||
            node?.time ||
            (Array.isArray(node?.days) ? node.days.join("/") : null) ||
            node?.id ||
            `#${seg + 1}`;
        parts.push(`${label}`);
    }
    return parts.join(" › ") || "(file)";
}

function listFiles() {
    if (!fs.existsSync(TRANSIT_DATA_DIR)) return [];
    return fs
        .readdirSync(TRANSIT_DATA_DIR)
        .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
        .sort();
}

/** ファイル名+更新日時から変更検知用のシグネチャを作る。 */
function computeSignature(files) {
    return files
        .map((f) => `${f}:${fs.statSync(path.join(TRANSIT_DATA_DIR, f)).mtimeMs}`)
        .join("|");
}

function loadAll(files) {
    const stops = [];
    const errors = [];
    const stopOwner = new Map(); // stop id -> file

    for (const file of files) {
        let raw;
        try {
            raw = JSON.parse(fs.readFileSync(path.join(TRANSIT_DATA_DIR, file), "utf-8"));
        } catch (err) {
            errors.push({ file, where: "(file)", message: `JSON として読み込めません: ${err.message}` });
            continue;
        }

        const result = transitFileSchema.safeParse(raw);
        if (!result.success) {
            for (const issue of result.error.issues) {
                errors.push({
                    file,
                    where: describePath(raw, issue.path),
                    message: issue.message,
                });
            }
            continue; // 不正なファイルは丸ごとスキップ
        }

        for (const stop of result.data.stops) {
            if (stopOwner.has(stop.id)) {
                errors.push({
                    file,
                    where: stop.name,
                    message: `stop の id "${stop.id}" は ${stopOwner.get(stop.id)} でも使われています (スキップ)`,
                });
                continue;
            }
            stopOwner.set(stop.id, file);

            // 手書きでも順序が崩れても大丈夫なように、時刻順に並べ替える
            for (const dir of stop.directions) {
                for (const svc of dir.services) {
                    for (const tt of svc.timetables) {
                        tt.departures.sort((a, b) => a.time.localeCompare(b.time));
                    }
                }
            }
            stops.push(stop);
        }
    }

    return { stops, errors };
}

/** 検証済みデータを返す。ファイルが変更されていれば自動で再読み込みする。 */
export function getTransitData() {
    const files = listFiles();
    const signature = computeSignature(files);

    if (signature !== cache.signature) {
        const { stops, errors } = loadAll(files);
        cache = { signature, stops, errors };
        console.log(`[Transit] Loaded ${stops.length} stop(s), ${errors.length} error(s)`);
        for (const e of errors) console.warn(`[Transit] ${e.file} › ${e.where}: ${e.message}`);
    }
    return cache;
}
