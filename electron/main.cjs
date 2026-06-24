const { app, BrowserWindow, shell, ipcMain, dialog } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const fsp = require("node:fs/promises");

const isDev = process.env.ELECTRON_DEV === "1";

let mainWindow = null;
let configPath = null;
let watcher = null;

// ---- sync-folder storage --------------------------------------------------
const DATA_FILE = "quillery-data.json";

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch {
    return {};
  }
}
function writeConfig(cfg) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(cfg));
  } catch (e) {
    console.error("writeConfig failed:", e);
  }
}
function dataFilePath() {
  const folder = readConfig().folder;
  return folder ? path.join(folder, DATA_FILE) : null;
}

function setupWatcher() {
  if (watcher) {
    watcher.close();
    watcher = null;
  }
  const file = dataFilePath();
  if (!file) return;
  try {
    let debounce = null;
    watcher = fs.watch(path.dirname(file), (_event, filename) => {
      if (filename && filename !== DATA_FILE) return;
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("sync:changed");
        }
      }, 300);
    });
  } catch (e) {
    console.error("sync watcher failed:", e);
  }
}

function registerSyncIpc() {
  ipcMain.handle("sync:getFolder", () => readConfig().folder ?? null);

  ipcMain.handle("sync:chooseFolder", async () => {
    const r = await dialog.showOpenDialog(mainWindow, {
      title: "Choose a folder to sync Quillery prompts",
      properties: ["openDirectory", "createDirectory"],
    });
    if (r.canceled || !r.filePaths[0]) return readConfig().folder ?? null;
    const cfg = readConfig();
    cfg.folder = r.filePaths[0];
    writeConfig(cfg);
    setupWatcher();
    return cfg.folder;
  });

  ipcMain.handle("sync:clearFolder", () => {
    const cfg = readConfig();
    delete cfg.folder;
    writeConfig(cfg);
    setupWatcher();
    return null;
  });

  ipcMain.handle("sync:read", async () => {
    const file = dataFilePath();
    if (!file) return null;
    try {
      return await fsp.readFile(file, "utf8");
    } catch {
      return null; // file doesn't exist yet
    }
  });

  ipcMain.handle("sync:write", async (_e, text) => {
    const file = dataFilePath();
    if (!file || typeof text !== "string") return;
    try {
      await fsp.mkdir(path.dirname(file), { recursive: true });
      await fsp.writeFile(file, text, "utf8");
    } catch (e) {
      console.error("sync write failed:", e);
    }
  });
}

// ---- window ---------------------------------------------------------------
function createWindow() {
  const win = new BrowserWindow({
    width: 1040,
    height: 780,
    minWidth: 380,
    minHeight: 520,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: "#ffffff",
    title: "Quillery",
    icon: path.join(__dirname, "..", "dist", "icons", "icon256.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  mainWindow = win;

  win.once("ready-to-show", () => win.show());

  // Default-deny: only http(s) links open in the user's browser; every other
  // scheme is refused rather than spawning an uncontrolled in-app window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:") || url.startsWith("http:")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  // Lock the main window to the bundled app — never let it navigate away.
  win.webContents.on("will-navigate", (event, url) => {
    const current = win.webContents.getURL();
    if (url !== current) {
      event.preventDefault();
      if (url.startsWith("https:") || url.startsWith("http:")) {
        shell.openExternal(url);
      }
    }
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

app.whenReady().then(() => {
  configPath = path.join(app.getPath("userData"), "quillery-sync.json");
  registerSyncIpc();
  createWindow();
  setupWatcher();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (watcher) watcher.close();
  if (process.platform !== "darwin") app.quit();
});
