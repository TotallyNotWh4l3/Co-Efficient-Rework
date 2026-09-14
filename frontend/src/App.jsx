// ===================================================
// ファイル名: App.jsx
// 作成日: 2026/08/27
// 作成者: ゴンザガ　ウェイン
// 概要: アプリケーションコンポーネント
// ===================================================

import Dashboard from "./components/Dashboard/Dashboard";
import DialogManager from "./components/Settings/Components/UI/Dialog/DialogManager";
import Login from "./components/Login/Login";

// Hooks
import { useSettingsState } from "./hooks/useSettings";
import { useDashboardState } from "./hooks/useDashboard";
import { useDialogState } from "./hooks/useDialog";
import { useTheme } from "./hooks/useTheme";
import { useAuthState, useAuth } from "./hooks/useAuth";

// Context
import { SettingsProvider } from "./context/SettingsContext";
import { DashboardProvider } from "./context/DashboardContext";
import { DialogProvider } from "./context/DialogContext";
import { AuthProvider } from "./context/AuthContext";
import { RealtimeProvider } from "./context/RealtimeContext";

// CSS
import "./styles/global.css";
import "./styles/variable.css";

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
