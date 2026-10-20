// ===================================================
// ファイル名: isMain.js
// 概要: 「このファイルが node で直接実行されたか」を判定するヘルパー。
//       seed / migrate を init.js からimportしても勝手に実行されず、
//       単体 (node shared/db/seed.js など) でも従来どおり動かせるようにする。
// ===================================================

import path from "path";
import { fileURLToPath } from "url";

/** Pass `import.meta.url`. True only when that file is the script node was started with. */
export default function isMain(metaUrl) {
    if (!process.argv[1]) return false;
    return path.resolve(process.argv[1]) === path.resolve(fileURLToPath(metaUrl));
}
