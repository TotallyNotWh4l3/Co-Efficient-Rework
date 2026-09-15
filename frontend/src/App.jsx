// ===================================================
// ファイル名: App.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: アプリケーションコンポーネント
// ===================================================

import Dashboard from "./modules/dashboard/Dashboard";
import DialogManager from "./common/Dialog/DialogManager";
import Login from "./modules/auth/Login";

// Hooks
import { useSettingsState } from "./modules/settings/useSettings";
import { useDashboardState } from "./modules/dashboard/useDashboard";
import { useDialogState } from "./shared/dialog/useDialog";
import { useTheme } from "./modules/themes/useTheme";
import { useAuthState, useAuth } from "./modules/auth/useAuth";

// Context
import { SettingsProvider } from "./modules/settings/SettingsContext";
import { DashboardProvider } from "./modules/dashboard/DashboardContext";
import { DialogProvider } from "./shared/dialog/DialogContext";
import { AuthProvider } from "./modules/auth/AuthContext";
import { RealtimeProvider } from "./shared/sse/RealtimeContext";

// CSS
import "./shared/styles/global.css";
import "./shared/styles/variable.css";

function ThemeApplier() {
    useTheme();
    return null;
}

function AppContent() {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <>
            <ThemeApplier />

            {user ? <Dashboard /> : <Login />}

            <DialogManager />
        </>
    );
}

// Runs *inside* RealtimeProvider, so useDashboardState's internal
// useRealtime() call resolves correctly.
function DashboardStateProvider({ user, children }) {
    const dashboardState = useDashboardState(user);

    return <DashboardProvider value={dashboardState}>{children}</DashboardProvider>;
}

export default function App() {
    const authState = useAuthState();
    const settingsState = useSettingsState(authState.user);
    const dialogState = useDialogState();
    console.log("[App] settingsState:", settingsState);

    return (
        <AuthProvider value={authState}>
            <SettingsProvider value={settingsState}>
                <DialogProvider value={dialogState}>
                    <RealtimeProvider>
                        <DashboardStateProvider user={authState.user}>
                            <AppContent />
                        </DashboardStateProvider>
                    </RealtimeProvider>
                </DialogProvider>
            </SettingsProvider>
        </AuthProvider>
    );
}
