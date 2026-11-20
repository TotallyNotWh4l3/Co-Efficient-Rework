// ===================================================
// ファイル名: registry.js
// 作成日: 2026/11/20
// 概要: サンドボックスのコンポーネント自動登録
//       playground/ 内の .jsx を自動で拾う（手動での配線は不要）
// ===================================================

// Every .jsx file dropped into ./playground is picked up automatically
// (same idea as the module registry — no manual wiring). Files starting
// with "_" (e.g. _Template.jsx) are ignored.
//
// A playground file must:
//   - `export default` the component (or a small demo wrapper) to render
//   - optionally `export const meta = { library, name, description }`
//     (library is used to group entries in the list; falls back to "Other")
const modules = import.meta.glob(["./playground/*.jsx", "!./playground/_*.jsx"], {
    eager: true,
});

export const SANDBOX_ENTRIES = Object.entries(modules)
    .map(([path, mod]) => {
        const fileName = path.split("/").pop().replace(/\.jsx$/, "");
        const meta = mod.meta ?? {};

        return {
            id: fileName,
            library: meta.library ?? "Other",
            name: meta.name ?? fileName,
            description: meta.description ?? "",
            component: mod.default,
        };
    })
    .filter((entry) => Boolean(entry.component))
    .sort(
        (a, b) =>
            a.library.localeCompare(b.library) || a.name.localeCompare(b.name),
    );

// [{ library, entries: [...] }] in list order, for the grouped sidebar list.
export function groupByLibrary(entries) {
    const groups = [];
    for (const entry of entries) {
        let group = groups.find((g) => g.library === entry.library);
        if (!group) {
            group = { library: entry.library, entries: [] };
            groups.push(group);
        }
        group.entries.push(entry);
    }
    return groups;
}
