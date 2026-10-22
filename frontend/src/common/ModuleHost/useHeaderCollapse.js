// ===================================================
// ファイル名: useHeaderCollapse.js
// 概要: モジュールヘッダーの折りたたみ状態。module.settings.headerCollapsed に保存される。
// ===================================================

import { useCallback } from "react";
import { useDashboard } from "../../modules/dashboard/useDashboard";

export default function useHeaderCollapse(module) {
    const { updateModuleSettings } = useDashboard();
    const collapsed = module?.settings?.headerCollapsed === true;

    const toggle = useCallback(() => {
        if (!module) return;
        updateModuleSettings(module.id, "headerCollapsed", !collapsed);
    }, [module, collapsed, updateModuleSettings]);

    return { collapsed, toggle };
}
