// ===================================================
// ファイル名: main.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: アプリケーションのエントリーポイント
// ===================================================

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <App/>
    </StrictMode>,
);
