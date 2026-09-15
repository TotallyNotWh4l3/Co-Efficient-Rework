// ===================================================
// ファイル名: Dialog.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ダイアログ コンポーネント
// ===================================================

import "./dialog.css";

export default function Dialog({ children, onClose, zIndex = 1100 }) {
    return (
        <>
            <div className="dialog__overlay" style={{ zIndex }} onClick={onClose} />

            <div
                className="dialog"
                style={{ zIndex: zIndex + 1 }}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </>
    );
}
