import { createContext, useContext } from "react";

const DashboardContext = createContext();

export function DashboardProvider({ value, children }) {
    return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboardContext() {
    const context = useContext(DashboardContext);

    if (!context) {
        throw new Error("useDashboardContext must be used within a DashboardProvider");
    }

    return context;
}
    