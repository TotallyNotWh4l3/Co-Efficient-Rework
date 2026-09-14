/**
 * Auto-discovers every frontend module's module.config.js at build time via
 * Vite's import.meta.glob (eager: true means all configs are bundled
 * up-front, not lazy-loaded — fine at this scale, revisit if module count
 * gets large enough that startup bundle size matters).
 *
 * Adding a new module should NEVER require touching App.jsx or any
 * dashboard/router setup by hand — just drop a module.config.js in
 * src/modules/<name>/.
 */
const configModules = import.meta.glob("./modules/*/module.config.js", { eager: true });

/**
 * @returns {Array<{ name: string, config: object }>}
 */
export function loadModules() {
    return Object.values(configModules)
        .map((mod) => mod.default)
        .filter((config) => {
            if (!config || typeof config.name !== "string") {
                console.error(
                    "[moduleRegistry] skipped a module.config.js — missing required \"name\" field",
                    config
                );
                return false;
            }
            return true;
        })
        .map((config) => ({ name: config.name, config }));
}
