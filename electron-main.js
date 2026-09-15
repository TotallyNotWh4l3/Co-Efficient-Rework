import { app, BrowserWindow } from "electron";
import { fork } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logPath = path.join(app.getPath("userData"), "app-log.txt");
const iconPath = path.join(__dirname, "frontend/public/favicon.ico");

function log(msg) {
    const line = `[${new Date().toISOString()}] ${msg}\n`;
    fs.appendFileSync(logPath, line);
    console.log(msg);
}

let serverProcess;
let mainWindow;

function startServer() {
    log("Starting backend server...");
    serverProcess = fork(path.join(__dirname, "backend/server.js"), [], {
        silent: true,
    });

    serverProcess.stdout.on("data", (data) => log(`[SERVER] ${data}`));
    serverProcess.stderr.on("data", (data) => log(`[SERVER ERROR] ${data}`));

    serverProcess.on("exit", (code) => {
        log(`Server process exited with code ${code}`);
    });

    serverProcess.on("error", (err) => {
        log(`Failed to start server process: ${err.message}`);
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        icon: iconPath,
        webPreferences: {
            contextIsolation: true,
        },
    });

    mainWindow.webContents.on("did-fail-load", (event, code, desc) => {
        log(`Page failed to load: ${desc} (code ${code}). Retrying in 1s...`);
        setTimeout(loadApp, 1000);
    });

    loadApp();
}

function loadApp() {
    log("Attempting to load http://192.168.200.105:3001 ...");
    mainWindow.loadURL("http://192.168.200.105:3001");
}

app.whenReady().then(() => {
    log("App ready.");
    startServer();
    createWindow();
});

app.on("window-all-closed", () => {
    if (serverProcess) serverProcess.kill();
    if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
    if (serverProcess) serverProcess.kill();
});
