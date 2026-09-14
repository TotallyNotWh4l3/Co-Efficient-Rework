import { createContext, useContext } from "react";

const SettingsContext = createContext(null);

export function SettingsProvider({ value, children }) {
    return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettingsContext() {
    const context = useContext(SettingsContext);

    if (!context) {
        throw new Error("useSettingsContext must be used inside SettingsProvider");
    }

    return context;
}
