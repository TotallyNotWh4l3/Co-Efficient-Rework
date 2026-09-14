require("dotenv").config();

const express = require("express");
const { loadModules, mountModuleRoutes } = require("./moduleRegistry");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Basic health check — useful once this is running headless on the kiosk PC
app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});

const modules = loadModules();
console.log(
    `[server] discovered ${modules.length} module(s): ${modules.map((m) => m.name).join(", ") || "(none)"}`
);
mountModuleRoutes(app, modules);

app.listen(PORT, () => {
    console.log(`[server] listening on port ${PORT}`);
});
