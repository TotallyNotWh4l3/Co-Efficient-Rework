import { createContext } from "react";

export const DialogContext = createContext(null);

export function DialogProvider({ value, children }) {
    return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>;
}
