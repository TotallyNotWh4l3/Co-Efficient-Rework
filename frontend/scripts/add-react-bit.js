// ===================================================
// ファイル名: add-react-bit.js
// 作成日: 2026/11/20
// 概要: React Bits のコンポーネントを名前（スペース可）から追加するスクリプト
//       使い方: npm run bits -- "Blur Text" "Split Text"
//               npm run bits -- "Blur Text" --variant TS-CSS
// ===================================================

import { spawnSync } from "node:child_process";

const VARIANTS = ["JS-CSS", "JS-TW", "TS-CSS", "TS-TW"];
const DEFAULT_VARIANT = "JS-CSS";

// "Blur Text" -> "BlurText". Only the first letter of each word is forced
// to upper case; the rest is left as typed so acronyms survive
// ("ASCII Text" -> "ASCIIText"). Already-PascalCase input passes through.
function toPascalCase(name) {
    return name
        .split(/[\s\-_]+/)
        .filter(Boolean)
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join("")
        .replace(/[^A-Za-z0-9]/g, "");
}

const args = process.argv.slice(2);
const names = [];
let variant = DEFAULT_VARIANT;

for (let i = 0; i < args.length; i++) {
    if (args[i] === "--variant" || args[i] === "-v") {
        variant = (args[++i] ?? "").toUpperCase();
    } else {
        names.push(args[i]);
    }
}

if (names.length === 0 || !VARIANTS.includes(variant)) {
    console.error('Usage: npm run bits -- "Blur Text" ["Split Text" ...] [--variant JS-CSS]');
    console.error(`Variants: ${VARIANTS.join(", ")} (default ${DEFAULT_VARIANT})`);
    process.exit(1);
}

let failed = 0;

for (const name of names) {
    const component = toPascalCase(name);
    const target = `@react-bits/${component}-${variant}`;

    console.log(`\n> ${target}`);

    // shell: true so `npx` resolves to npx.cmd on Windows.
    const result = spawnSync("npx", ["shadcn@latest", "add", target], {
        stdio: "inherit",
        shell: true,
    });

    if (result.status !== 0) {
        failed++;
        console.error(`Failed: ${target} (check the name on reactbits.dev)`);
    }
}

process.exit(failed > 0 ? 1 : 0);
