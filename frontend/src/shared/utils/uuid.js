// ===================================================
// ファイル名: uuid.js
// 概要: crypto.randomUUID() の代替
//       crypto.randomUUID() は「secure context」でしか使えず、Electron
//       アプリをfile://経由で読み込むとブラウザ側でこのAPIだけ無効化され、
//       呼び出し箇所でクラッシュ（画面が白くなる）していた。
//       crypto.getRandomValues() はsecure context制限を受けないため、
//       それを使って同等のUUID v4を自前で組み立てる。
// ===================================================

export function uuidv4() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        try {
            return crypto.randomUUID();
        } catch {
            // Fall through to the manual implementation below (this is
            // exactly the secure-context failure this file exists to
            // work around).
        }
    }

    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
        const bytes = crypto.getRandomValues(new Uint8Array(16));
        bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
        bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant

        const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
        return [
            hex.slice(0, 4).join(""),
            hex.slice(4, 6).join(""),
            hex.slice(6, 8).join(""),
            hex.slice(8, 10).join(""),
            hex.slice(10, 16).join(""),
        ].join("-");
    }

    // Last-resort fallback (not cryptographically strong, but this path
    // should never actually be hit in a browser/Electron renderer).
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
