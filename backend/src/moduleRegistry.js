const fs = require("fs");
const path = require("path");

const MODULES_DIR = path.join(__dirname, "modules");

/**
 * Auto-discovers every module under src/modules/<name>/module.config.js
 * and loads its config. A module is only picked up if that exact file
 * exists — a folder with no config is silently skipped (lets you scaffold
 * a module folder before it's ready).
 *
 * Adding a new module should NEVER require touching this file, server.js,
 * or any route setup — just drop a folder with a module.config.js in it.
 *
 * @returns {Array<{ name: string, config: object }>}
 */
function loadModules() {
    if (!fs.existsSync(MODULES_DIR)) {
        return [];
    }

    const entries = fs.readdirSync(MODULES_DIR, { withFileTypes: true });
    const modules = [];

    for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const configPath = path.join(MODULES_DIR, entry.name, "module.config.js");
        if (!fs.existsSync(configPath)) continue;

        const config = require(configPath);

        if (!config || typeof config.name !== "string") {
            throw new Error(
                `Module in "${entry.name}" has an invalid module.config.js — missing required "name" field.`
            );
        }

        modules.push({ name: config.name, config });
    }

    return modules;
}

/**
 * Wires every discovered module's router onto the Express app at its
 * declared basePath. Modules with no routes/basePath declared are skipped
 * (e.g. a module that's frontend-only, or not ready yet).
 *
 * @param {import('express').Express} app
 * @param {Array<{ name: string, config: object }>} modules
 */
function mountModuleRoutes(app, modules) {
    for (const { name, config } of modules) {
        const basePath = config.routes?.basePath;
        const router = config.routes?.router;

        if (!basePath || !router) {
            continue;
        }

        app.use(basePath, router);
        console.log(`[moduleRegistry] mounted "${name}" at ${basePath}`);
    }
}

module.exports = { loadModules, mountModuleRoutes };
