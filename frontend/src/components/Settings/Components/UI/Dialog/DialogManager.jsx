// ===================================================
// ファイル名: DialogManager.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: ダイアログマネージャー コンポーネント
// ===================================================

import Dialog from "./Dialog";

import { useDialog } from "../../../../../hooks/useDialog";
import { useLocation } from "../../../../../hooks/useLocation";
import { useSettings } from "../../../../../hooks/useSettings";
import { useThemes } from "../../../../../hooks/useThemes";

// Dialogs
import LocationDialog from "../../../Dialogs/LocationDialog";
import ConfirmDialog from "../../../Dialogs/ConfirmDialog";
import ThemeDialog from "../../../Dialogs/ThemeDialog";

export default function DialogManager() {
    const { dialogs, closeDialog } = useDialog();
    const { createLocation, updateLocation } = useLocation();
    const { settings, applyTheme } = useSettings();
    const { createTheme, updateTheme, deleteTheme } = useThemes();

    return (
        <>
            {dialogs.map((dialog, index) => {
                const zIndex = 1100 + index * 10;
                let content = null;
                switch (dialog.type) {
                    case "location":
                        content = (
                            <LocationDialog
                                initialLocation={dialog.props?.location}
                                onClose={() => closeDialog(dialog.id)}
                                onSave={async (location) => {
                                    if (dialog.props?.location) {
                                        await updateLocation(location.id, location);
                                    } else {
                                        await createLocation(location);
                                    }
                                    closeDialog(dialog.id);
                                }}
                            />
                        );
                        break;
                    case "confirm":
                        content = (
                            <ConfirmDialog
                                {...dialog.props}
                                onClose={() => closeDialog(dialog.id)}
                                onConfirm={() => {
                                    dialog.props?.onConfirm?.();
                                    closeDialog(dialog.id);
                                }}
                            />
                        );
                        break;
                    case "theme":
                        content = (
                            <ThemeDialog
                                initialTheme={dialog.props?.theme}
                                baseTheme={dialog.props?.baseTheme}
                                onClose={() => closeDialog(dialog.id)}
                                onSave={async (idOrPayload, maybePayload) => {
                                    if (maybePayload) {
                                        await updateTheme(idOrPayload, maybePayload);
                                    } else {
                                        await createTheme(idOrPayload);
                                    }
                                    closeDialog(dialog.id);
                                }}
                                onDelete={async (id) => {
                                    const wasActive =
                                        settings?.preferences?.appearance?.currentTheme === id;

                                    await deleteTheme(id);

                                    if (wasActive) {
                                        applyTheme("dark-default");
                                    }

                                    closeDialog(dialog.id);
                                }}
                            />
                        );
                        break;
                    default:
                        console.warn(`[DialogManager] Unknown dialog type: ${dialog.type}`);
                        return null;
                }
                return (
                    <Dialog key={dialog.id} zIndex={zIndex} onClose={() => closeDialog(dialog.id)}>
                        {content}
                    </Dialog>
                );
            })}
        </>
    );
}
