
// ===================================================
// ファイル名: DialogOverlay.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ダイアログオーバーレイ コンポーネント
// ===================================================

export default function DialogOverlay({ zIndex, onClose }) {
    return <div className="dialog-overlay" style={{ zIndex }} onClick={onClose} />;
}
