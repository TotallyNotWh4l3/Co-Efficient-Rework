// ===================================================
// ファイル名: useDialog.js
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ダイアログを管理するカスタムフック
// ===================================================

import { useCallback, useState } from "react";
import { useContext } from "react";

import { DialogContext } from "./DialogContext";
import { uuidv4 } from "../utils/uuid";

export function useDialogState() {
    const [dialogs, setDialogs] = useState([]);

    const openDialog = useCallback((dialog) => {
        setDialogs((prev) => [
            ...prev,
            {
                id: uuidv4(),
                ...dialog,
            },
        ]);
    }, []);

    const closeDialog = useCallback((id) => {
        setDialogs((prev) => prev.filter((dialog) => dialog.id !== id));
    }, []);

    const closeTopDialog = useCallback(() => {
        setDialogs((prev) => prev.slice(0, -1));
    }, []);

    const closeAllDialogs = useCallback(() => {
        setDialogs([]);
    }, []);

    return {
        dialogs,

        openDialog,
        closeDialog,
        closeTopDialog,
        closeAllDialogs,
    };
}

export function useDialog() {
    return useContext(DialogContext);
}
