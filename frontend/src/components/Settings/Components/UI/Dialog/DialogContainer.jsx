
// ===================================================
// ファイル名: DialogContainer.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ダイアログコンテナ コンポーネント
// ===================================================

export default function DialogContainer({ zIndex, children }) {
    return (
        <div className="dialog-container" style={{ zIndex }}>
            {children}
        </div>
    );
}
