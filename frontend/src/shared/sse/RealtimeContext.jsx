import { createContext, useContext, useRef, useCallback } from "react";

const RealtimeContext = createContext(null);

export function RealtimeProvider({ children }) {
    // url -> { source, listeners: Map<eventName, Set<callback>>, refCount }
    const connections = useRef(new Map());

    const getOrCreate = useCallback((url) => {
        let entry = connections.current.get(url);
        if (!entry) {
            const source = new EventSource(url);
            entry = { source, listeners: new Map(), refCount: 0 };
            connections.current.set(url, entry);
        }
        return entry;
    }, []);

    // Subscribe to one event type on one stream URL. Returns an unsubscribe fn.
    const subscribe = useCallback(
        (url, eventName, callback) => {
            const entry = getOrCreate(url);
            entry.refCount += 1;

            if (!entry.listeners.has(eventName)) {
                const handler = (e) => {
                    entry.listeners.get(eventName).forEach((cb) => cb(e));
                };
                entry.listeners.set(eventName, new Set());
                entry.source.addEventListener(eventName, handler);
                entry.listeners.get(eventName)._handler = handler; // stash for cleanup
            }
            entry.listeners.get(eventName).add(callback);

            return () => {
                const set = entry.listeners.get(eventName);
                if (set) set.delete(callback);
                entry.refCount -= 1;

                if (entry.refCount <= 0) {
                    // Last subscriber gone — close the connection and clean up.
                    for (const [name, listenerSet] of entry.listeners.entries()) {
                        if (listenerSet._handler) {
                            entry.source.removeEventListener(name, listenerSet._handler);
                        }
                    }
                    entry.source.close();
                    connections.current.delete(url);
                }
            };
        },
        [getOrCreate],
    );

    return <RealtimeContext.Provider value={{ subscribe }}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
    const ctx = useContext(RealtimeContext);
    if (!ctx) throw new Error("useRealtime must be used within a RealtimeProvider");
    return ctx;
}
